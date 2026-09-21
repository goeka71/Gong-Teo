import csv
import os
from collections import Counter

from django.conf import settings
from django.core.management.base import CommandError
from django.db import transaction

from facilities.models import Facility, FacilityDetail

from .backfill_program_subfacility import Command as BackfillCommand

DEFAULT_DETAIL_CSV = os.path.join(settings.BASE_DIR, "data", "facility_detail.csv")
REQUIRED_COLUMNS = {
    "facility_id", "phone", "website", "in_out", "op_hour", "fee", "shower", "parking",
}
TEXT_FIELDS = ("phone", "website", "in_out", "op_hour", "fee")


def to_bool(value):
    """import_data.py 의 _to_bool 과 동일"""
    return str(value).strip().lower() in ("true", "1", "yes")


class Command(BackfillCommand):
    """Facility 는 있는데 FacilityDetail 이 없는 시설에만, CSV 값으로 상세를 만든다.

    - 기준은 facility_detail.csv (로컬 DB 값이 아님)
    - 이미 FacilityDetail 이 있는 시설은 수정/삭제하지 않는다 (INSERT 만 수행)
    """

    help = (
        "Facility 는 있는데 FacilityDetail 이 없는 시설에만 facility_detail.csv 값으로 "
        "FacilityDetail 을 생성합니다. 이미 상세가 있는 시설은 건드리지 않습니다."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="DB를 바꾸지 않고 생성 예정 건수만 보고합니다.",
        )
        parser.add_argument(
            "--csv",
            default=DEFAULT_DETAIL_CSV,
            help="읽을 csv 경로 (기본: data/facility_detail.csv)",
        )
        parser.add_argument(
            "--log-limit",
            type=int,
            default=20,
            help="항목별 로그를 몇 건까지 출력할지 (기본 20)",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="실제 생성 전 확인 프롬프트를 건너뜁니다.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["log_limit"]

        self._print_db_target()
        self.stdout.write(
            self.style.WARNING("[DRY-RUN] DB를 변경하지 않습니다.")
            if dry_run else
            self.style.WARNING("[실제 반영] FacilityDetail row 를 새로 생성합니다.")
        )

        csv_rows, csv_dups = self._read_detail_csv(options["csv"])
        plan = self._plan(csv_rows)
        self._report_detail(csv_rows, csv_dups, plan, limit)

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                "\n[DRY-RUN] 완료. DB는 변경되지 않았습니다."
            ))
            return

        total = len(plan["to_create"])
        if total == 0:
            self.stdout.write(self.style.SUCCESS("\n새로 만들 row 가 없습니다."))
            return

        if not options["yes"]:
            try:
                answer = input(f"\n위 DB에 FacilityDetail {total}건을 새로 생성합니다. "
                               f"계속하려면 'yes' 입력: ")
            except EOFError:
                answer = ""
            if answer.strip().lower() != "yes":
                self.stdout.write(self.style.WARNING("취소했습니다. DB는 변경되지 않았습니다."))
                return

        created = self._create(plan["to_create"])
        self.stdout.write(self.style.SUCCESS(f"\n=== 완료: {created}건 생성 ==="))

    # ── csv ──
    def _read_detail_csv(self, path):
        """facility_id -> 정규화된 값 dict. 시설당 1개 규칙이라 중복이면 첫 행만 쓴다."""
        if not os.path.exists(path):
            raise CommandError(f"csv 를 찾을 수 없습니다: {path}")

        rows, dups = {}, Counter()
        with open(path, encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise CommandError(f"csv 에 필요한 컬럼이 없습니다: {sorted(missing)}")

            for raw in reader:
                fid = int(raw["facility_id"])
                if fid in rows:
                    dups[fid] += 1
                    continue
                values = {name: raw.get(name) or "" for name in TEXT_FIELDS}
                values["shower"] = to_bool(raw.get("shower"))
                values["parking"] = to_bool(raw.get("parking"))
                rows[fid] = values
        return rows, dups

    # ── 계획 ──
    def _plan(self, csv_rows):
        facility_ids = set(Facility.objects.values_list("id", flat=True))
        detail_count = Counter(
            FacilityDetail.objects.values_list("facility_id", flat=True)
        )
        max_len = {
            name: FacilityDetail._meta.get_field(name).max_length for name in TEXT_FIELDS
        }

        to_create = {}          # facility_id -> 값
        already_has = []        # CSV 에 있고 DB 에 이미 상세가 있는 시설
        not_in_db = []          # CSV 에 있는데 DB 에 Facility 가 없음
        too_long = []           # 필드 길이 초과 (Postgres 에서 에러가 나므로 생성하지 않음)

        for fid, values in csv_rows.items():
            if fid not in facility_ids:
                not_in_db.append(fid)
            elif detail_count.get(fid):
                already_has.append((fid, detail_count[fid]))
            else:
                over = [n for n in TEXT_FIELDS if len(values[n]) > max_len[n]]
                if over:
                    too_long.append((fid, over))
                else:
                    to_create[fid] = values

        no_csv = sorted(
            fid for fid in facility_ids
            if fid not in csv_rows and not detail_count.get(fid)
        )
        return {
            "facility_total": len(facility_ids),
            "detail_total": sum(detail_count.values()),
            "to_create": to_create,
            "already_has": already_has,
            "not_in_db": not_in_db,
            "too_long": too_long,
            "no_csv": no_csv,
            "multi_existing": [fid for fid, n in detail_count.items() if n > 1],
        }

    # ── 리포트 ──
    def _report_detail(self, csv_rows, csv_dups, plan, limit):
        w = self.stdout.write
        n_create = len(plan["to_create"])
        w("\n===== 결과 =====")
        w(f"CSV: {len(csv_rows)}개 시설 (csv 안 중복 facility_id: {len(csv_dups)}개)")
        w(f"DB: Facility {plan['facility_total']}개 / FacilityDetail {plan['detail_total']}건 (현재)")
        w("")
        w(f"새로 생성될 FacilityDetail            : {n_create}건")
        w(f"이미 상세가 있어 건드리지 않음         : {len(plan['already_has'])}개 시설")
        w(f"CSV에 있지만 DB에 Facility 없음(생성 안 함): {len(plan['not_in_db'])}개")
        w(f"필드 길이 초과라 생성하지 않음         : {len(plan['too_long'])}개")
        w(f"CSV에 없어서 상세를 못 만드는 Facility  : {len(plan['no_csv'])}개")
        w(f"생성 후 예상 FacilityDetail: {plan['detail_total'] + n_create}건 "
          f"(= 현재 {plan['detail_total']} + 생성 {n_create})")

        w("\n[검증] 기존 FacilityDetail 은 수정/삭제하지 않습니다. (INSERT 만 수행)")
        w("[검증] 실제 생성 시 생성된 row 의 값이 CSV 와 그대로 같은지 확인하고, "
          "다르면 롤백합니다.")

        self._log_list(
            "[건너뜀] 이미 상세가 있는 시설 (시설 id, 기존 상세 건수)",
            [(fid, f"{n}건") for fid, n in plan["already_has"]], limit)
        self._log_list(
            "[주의] CSV에 있지만 DB에 없는 facility_id (생성 안 함)",
            [(fid, "") for fid in plan["not_in_db"]], limit)
        self._log_list(
            "[주의] 필드 길이 초과 (시설 id, 초과 필드)",
            [(fid, ", ".join(over)) for fid, over in plan["too_long"]], limit)
        self._log_list(
            "[주의] CSV에 행이 없어 상세를 만들 수 없는 Facility",
            [(fid, "") for fid in plan["no_csv"]], limit)
        self._log_list(
            "[주의] 한 시설에 상세가 2건 이상 이미 있는 시설",
            [(fid, "") for fid in plan["multi_existing"]], limit)
        self._log_list(
            "[주의] CSV 안에서 facility_id 가 중복 (첫 행만 사용)",
            [(fid, f"+{n}행 무시") for fid, n in csv_dups.items()], limit)

        sample = list(plan["to_create"].items())[:3]
        if sample:
            w("\n생성 예정 샘플(앞 3건):")
            for fid, v in sample:
                w(f"  facility {fid}: {v}")

    # ── 생성 ──
    def _create(self, to_create):
        with transaction.atomic():
            before = FacilityDetail.objects.count()

            FacilityDetail.objects.bulk_create(
                [FacilityDetail(facility_id=fid, **values) for fid, values in to_create.items()],
                batch_size=500,
            )

            after = FacilityDetail.objects.count()
            if after != before + len(to_create):
                raise CommandError(
                    f"생성 건수가 예상과 다릅니다. 예상 +{len(to_create)}, "
                    f"실제 {before}→{after}. 롤백합니다."
                )

            # 생성된 row 가 CSV 값 그대로인지, 시설당 1건인지 확인
            fields = ("facility_id",) + TEXT_FIELDS + ("shower", "parking")
            saved = {}
            for row in FacilityDetail.objects.filter(
                facility_id__in=list(to_create)
            ).values(*fields):
                if row["facility_id"] in saved:
                    raise CommandError(
                        f"facility {row['facility_id']} 에 상세가 2건 이상 생겼습니다. 롤백합니다."
                    )
                saved[row["facility_id"]] = {k: row[k] for k in fields if k != "facility_id"}
            if saved != to_create:
                bad = [fid for fid in to_create if saved.get(fid) != to_create[fid]]
                raise CommandError(
                    f"생성된 값이 CSV 와 다른 시설이 있습니다: {bad[:10]}. 롤백합니다."
                )
        return len(to_create)
