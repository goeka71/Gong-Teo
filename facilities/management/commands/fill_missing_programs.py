import csv
import os
from collections import Counter, defaultdict

from django.core.management.base import CommandError
from django.db import transaction

from facilities.models import Facility, Program

from .backfill_program_subfacility import (
    Command as BackfillCommand,
    REQUIRED_COLUMNS,
)

CREATE_BATCH_SIZE = 1000


def to_int(value):
    """import_data.py 의 _to_int 와 동일: 빈 값/숫자 아님은 None"""
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def make_key(row):
    return (
        int(row["facility_id"]),
        row["program_name"],
        row.get("program_day") or "",
        row.get("program_time") or "",
    )


class Command(BackfillCommand):
    """CSV 에는 있고 DB 에는 없는 Program 만 새로 만든다.

    키(facility_id + program_name + program_day + program_time)별로
    `CSV 행 수 - DB 행 수` 만큼만, CSV 순서상 뒤쪽 행부터 생성한다.
    (임포트가 CSV 앞에서부터 들어가다 중단된 상황을 전제로, 이미 있는 것은
    CSV 순서상 앞쪽 행이라고 본다.) 기존 DB row 는 수정/삭제하지 않는다.
    """

    help = (
        "CSV 에는 있고 DB 에는 없는 Program 만 새로 생성합니다. "
        "키별로 (CSV 행 수 - DB 행 수) 만큼만 만들고 subfacility_id 도 함께 넣습니다. "
        "기존 DB row 는 건드리지 않습니다."
    )

    def add_arguments(self, parser):
        super().add_arguments(parser)  # --dry-run, --csv, --log-limit
        parser.add_argument(
            "--yes",
            action="store_true",
            help="실제 생성 전 확인 프롬프트를 건너뜁니다.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["log_limit"]
        path = options["csv"]

        self._print_db_target()
        self.stdout.write(
            self.style.WARNING("[DRY-RUN] DB를 변경하지 않습니다.")
            if dry_run else
            self.style.WARNING("[실제 반영] Program row 를 새로 생성합니다.")
        )

        groups = self._read_csv(path)
        targets, csv_skipped = self._resolve_targets(groups)
        facility_ids = set(Facility.objects.values_list("id", flat=True))
        plan = self._plan(groups, facility_ids)

        self._report_fill(groups, targets, csv_skipped, plan, limit)

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                "\n[DRY-RUN] 완료. DB는 변경되지 않았습니다."
            ))
            return

        total = plan["to_create_total"]
        if total == 0:
            self.stdout.write(self.style.SUCCESS("\n새로 만들 row 가 없습니다."))
            return

        if not options["yes"]:
            try:
                answer = input(f"\n위 DB에 Program {total}건을 새로 생성합니다. "
                               f"계속하려면 'yes' 입력: ")
            except EOFError:
                answer = ""
            if answer.strip().lower() != "yes":
                self.stdout.write(self.style.WARNING("취소했습니다. DB는 변경되지 않았습니다."))
                return

        created = self._create(path, groups, targets, plan)
        self.stdout.write(self.style.SUCCESS(f"\n=== 완료: {created}건 생성 ==="))

    # ── csv (cap 까지 기억) ──
    def _read_csv(self, path):
        if not os.path.exists(path):
            raise CommandError(f"csv 를 찾을 수 없습니다: {path}")

        groups = {}
        with open(path, encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            missing = (REQUIRED_COLUMNS | {"program_cap"}) - set(reader.fieldnames or [])
            if missing:
                raise CommandError(f"csv 에 필요한 컬럼이 없습니다: {sorted(missing)}")

            for row in reader:
                group = groups.setdefault(
                    make_key(row), {"rows": 0, "values": set(), "caps": []}
                )
                group["rows"] += 1
                group["values"].add((row.get("subfacility_id") or "").strip())
                group["caps"].append(to_int(row.get("program_cap")))
        return groups

    # ── 계획 ──
    def _plan(self, groups, facility_ids):
        db_n = Counter()
        db_caps = defaultdict(list)     # id 순서대로
        db_only = Counter()
        db_total = 0

        rows = Program.objects.order_by("id").values_list(
            "facility_id", "program_name", "program_day", "program_time", "program_cap",
        ).iterator(chunk_size=5000)
        for fid, name, day, time, cap in rows:
            db_total += 1
            key = (fid, name, day or "", time or "")
            if key in groups:
                db_n[key] += 1
                db_caps[key].append(cap)
            else:
                db_only[key] += 1

        to_create = {}          # key -> 만들 개수
        kinds = Counter()       # 키 분류별 개수
        rows_by_kind = Counter()
        partial = []            # (key, csv_n, db_n)
        db_more = []            # (key, csv_n, db_n)
        no_facility = Counter()
        cap_mismatch = []

        for key, g in groups.items():
            csv_n, n = g["rows"], db_n.get(key, 0)
            m = min(n, csv_n)
            if m and db_caps[key][:m] != g["caps"][:m]:
                cap_mismatch.append(key)

            if n > csv_n:
                kinds["db_more"] += 1
                db_more.append((key, csv_n, n))
                continue
            if n == csv_n:
                kinds["equal"] += 1
                continue

            missing = csv_n - n
            if key[0] not in facility_ids:
                no_facility[key[0]] += missing
                continue
            to_create[key] = missing
            if n == 0:
                kinds["absent"] += 1
            else:
                kinds["partial"] += 1
                partial.append((key, csv_n, n))
            rows_by_kind["absent" if n == 0 else "partial"] += missing

        return {
            "db_total": db_total,
            "to_create": to_create,
            "to_create_total": sum(to_create.values()),
            "kinds": kinds,
            "rows_by_kind": rows_by_kind,
            "partial": partial,
            "db_more": db_more,
            "db_only": db_only,
            "no_facility": no_facility,
            "cap_mismatch": cap_mismatch,
        }

    # ── 리포트 ──
    def _report_fill(self, groups, targets, csv_skipped, plan, limit):
        w = self.stdout.write
        k, rk = plan["kinds"], plan["rows_by_kind"]
        csv_rows = sum(g["rows"] for g in groups.values())
        total = plan["to_create_total"]

        w("\n===== 결과 =====")
        w(f"CSV: {csv_rows}행 / 고유 키 {len(groups)}개")
        w(f"DB Program(현재): {plan['db_total']}행")
        w("")
        w("[키별 분류]")
        w(f"  CSV 행 수 == DB 행 수 (그대로 둠)          : {k['equal']}키")
        w(f"  DB에 아예 없음 (CSV 행 전부 생성)          : {k['absent']}키 / {rk['absent']}행")
        w(f"  일부만 있음 = '행 수 불일치' (차이만큼 생성): {k['partial']}키 / {rk['partial']}행")
        w(f"  DB 행이 CSV보다 많음 (생성 안 함)          : {k['db_more']}키")
        w(f"  DB에만 있음 (CSV에 없는 키, 건드리지 않음)  : {len(plan['db_only'])}키 / "
          f"{sum(plan['db_only'].values())}행")
        w("")
        w(f"새로 생성될 row: {total}건")

        new_with_sub = new_blank = new_problem = 0
        for key, n in plan["to_create"].items():
            if key in targets:
                new_with_sub += n
            elif "정상 NULL" in csv_skipped.get(key, ""):
                new_blank += n
            else:
                new_problem += n
        w(f"  ├ subfacility_id 를 넣어서 생성      : {new_with_sub}")
        w(f"  ├ CSV 값이 비어 있어 NULL 로 생성(정상): {new_blank}")
        w(f"  └ CSV 값 문제로 NULL 로 생성(로그 참고) : {new_problem}")
        w(f"생성 후 예상 DB Program: {plan['db_total'] + total}행 "
          f"(= 현재 {plan['db_total']} + 생성 {total})")

        w("\n[검증] 기존 DB row 는 수정/삭제하지 않습니다. (INSERT 만 수행)")
        w(f"[검증] 이미 있는 row 의 program_cap 이 CSV 앞쪽 행과 다른 키: {len(plan['cap_mismatch'])}개"
          "  (0 이어야 '앞에서부터 들어가다 중단' 가정이 맞음)")

        self._log_list(
            "[일부만 있는 키] 차이만큼만 생성 (키, CSV행수/DB행수)",
            [(key, f"CSV {c} / DB {n} → {c - n}건 생성") for key, c, n in plan["partial"]],
            limit,
        )
        self._log_list(
            "[DB에만 있는 키] CSV에 없으므로 건드리지 않음 (테스트 등 사용자 데이터)",
            [(key, f"{n}행") for key, n in plan["db_only"].items()],
            limit,
        )
        self._log_list(
            "[주의] DB 행이 CSV보다 많은 키 (생성 안 함)",
            [(key, f"CSV {c} / DB {n}") for key, c, n in plan["db_more"]],
            limit,
        )
        self._log_list(
            "[주의] DB에 없는 facility 라 생성하지 않는 행",
            [(f"facility {fid}", f"{n}행") for fid, n in plan["no_facility"].items()],
            limit,
        )
        self._log_list(
            "[주의] program_cap 이 CSV 앞쪽 행과 다른 키",
            [(key, "") for key in plan["cap_mismatch"]],
            limit,
        )
        problems = [(key, r) for key, r in csv_skipped.items()
                    if "정상 NULL" not in r and key in plan["to_create"]]
        self._log_list("[주의] CSV subfacility_id 문제로 NULL 로 생성하는 키", problems, limit)

    # ── 생성 ──
    def _create(self, path, groups, targets, plan):
        to_create = plan["to_create"]
        seen = Counter()
        batch = []
        created = 0

        with transaction.atomic():
            before = Program.objects.count()

            with open(path, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    key = make_key(row)
                    seen[key] += 1
                    need = to_create.get(key)
                    if not need:
                        continue
                    # CSV 순서상 앞쪽 db_n 개는 이미 DB에 있다고 보고 건너뛴다.
                    if seen[key] <= groups[key]["rows"] - need:
                        continue

                    batch.append(Program(
                        facility_id=key[0],
                        subfacility_id=targets.get(key),
                        program_name=key[1],
                        program_day=key[2],
                        program_cap=to_int(row.get("program_cap")),
                        program_time=key[3],
                    ))
                    if len(batch) >= CREATE_BATCH_SIZE:
                        Program.objects.bulk_create(batch, batch_size=CREATE_BATCH_SIZE)
                        created += len(batch)
                        batch = []
                        self.stdout.write(f"  {created}/{plan['to_create_total']}건 생성 중...")
                        self.stdout.flush()
            if batch:
                Program.objects.bulk_create(batch, batch_size=CREATE_BATCH_SIZE)
                created += len(batch)

            after = Program.objects.count()
            if created != plan["to_create_total"] or after != before + created:
                # 예상과 다르면 예외로 전체 롤백 (반쪽 상태를 남기지 않는다)
                raise CommandError(
                    f"생성 건수가 예상과 다릅니다. 예상 {plan['to_create_total']}, "
                    f"실제 {created}, DB {before}→{after}. 롤백합니다."
                )
        return created
