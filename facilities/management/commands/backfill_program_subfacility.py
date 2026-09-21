import csv
import os
from collections import Counter, defaultdict

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from facilities.models import Program, SubFacility

DEFAULT_CSV = os.path.join(settings.BASE_DIR, "data", "program.csv")
REQUIRED_COLUMNS = {
    "facility_id", "subfacility_id", "program_name", "program_day", "program_time",
}
UPDATE_BATCH_SIZE = 500


class Command(BaseCommand):
    help = (
        "data/program.csv 의 subfacility_id 를 기존 Program row 에 채워 넣습니다. "
        "새 row 는 만들지 않고, subfacility 가 비어 있는(NULL) row 의 "
        "subfacility_id 만 갱신합니다. (facility_id + program_name + "
        "program_day + program_time 조합으로 매칭)"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="DB를 바꾸지 않고 매칭/업데이트 예정 건수만 보고합니다.",
        )
        parser.add_argument(
            "--csv",
            default=DEFAULT_CSV,
            help="읽을 csv 경로 (기본: data/program.csv)",
        )
        parser.add_argument(
            "--log-limit",
            type=int,
            default=20,
            help="항목별 로그(매칭 실패 등)를 몇 건까지 출력할지 (기본 20)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["log_limit"]

        self._print_db_target()
        self.stdout.write(
            self.style.WARNING("[DRY-RUN] DB를 변경하지 않습니다.")
            if dry_run else
            self.style.WARNING("[실제 반영] DB를 변경합니다.")
        )

        groups = self._read_csv(options["csv"])
        targets, csv_skipped = self._resolve_targets(groups)
        plan = self._match_db(groups, targets, csv_skipped)

        self._report(groups, csv_skipped, plan, limit)

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                "\n[DRY-RUN] 완료. DB는 변경되지 않았습니다."
            ))
            return

        updated = self._apply(plan["to_update"])
        self.stdout.write(self.style.SUCCESS(
            f"\n=== 완료: {updated}건 업데이트 ==="
        ))

    # ── csv ──
    def _read_csv(self, path):
        """csv 를 키(facility, name, day, time) 별로 묶는다.
        키 하나에 여러 행이 있을 수 있어서(중복 프로그램) 행 수와 값 집합을 센다."""
        if not os.path.exists(path):
            raise CommandError(f"csv 를 찾을 수 없습니다: {path}")

        groups = {}
        with open(path, encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise CommandError(f"csv 에 필요한 컬럼이 없습니다: {sorted(missing)}")

            for row in reader:
                key = (
                    int(row["facility_id"]),
                    row["program_name"],
                    row.get("program_day") or "",
                    row.get("program_time") or "",
                )
                group = groups.setdefault(key, {"rows": 0, "values": set()})
                group["rows"] += 1
                group["values"].add((row.get("subfacility_id") or "").strip())
        return groups

    def _resolve_targets(self, groups):
        """키 → 넣을 subfacility_id. 넣으면 안 되는 키는 사유와 함께 csv_skipped 로."""
        facility_of_sub = dict(SubFacility.objects.values_list("id", "facility_id"))
        targets = {}
        csv_skipped = {}  # key -> 사유

        for key, group in groups.items():
            values = group["values"]
            if len(values) > 1:
                csv_skipped[key] = "csv 안에서 같은 키의 subfacility_id 가 서로 다름"
                continue

            (value,) = values
            if value == "":
                csv_skipped[key] = "csv subfacility_id 비어 있음(정상 NULL)"
                continue

            try:
                sub_id = int(float(value))
            except ValueError:
                csv_skipped[key] = f"subfacility_id 가 숫자가 아님: {value!r}"
                continue

            if sub_id not in facility_of_sub:
                csv_skipped[key] = f"DB에 없는 SubFacility id: {sub_id}"
            elif facility_of_sub[sub_id] != key[0]:
                csv_skipped[key] = (
                    f"SubFacility {sub_id} 는 facility {facility_of_sub[sub_id]} 소속 "
                    f"(csv facility {key[0]} 와 다름)"
                )
            else:
                targets[key] = sub_id
        return targets, csv_skipped

    # ── DB 매칭 ──
    def _match_db(self, groups, targets, csv_skipped):
        counts = Counter()
        to_update = defaultdict(list)   # subfacility_id -> [program id, ...]
        db_group_size = Counter()
        db_only = Counter()             # csv 에 없는 DB row (키별 건수)
        already_set_diff = []           # DB 에 이미 다른 값이 있어 건드리지 않는 row

        rows = Program.objects.values_list(
            "id", "facility_id", "program_name", "program_day",
            "program_time", "subfacility_id",
        ).iterator(chunk_size=5000)

        for pid, fid, name, day, time, current in rows:
            counts["db_total"] += 1
            key = (fid, name, day or "", time or "")
            db_group_size[key] += 1

            if key not in groups:
                counts["db_not_in_csv"] += 1
                db_only[key] += 1
                continue

            counts["matched"] += 1
            if key in csv_skipped:
                counts["matched_no_update_csv_null_or_invalid"] += 1
            elif current is None:
                to_update[targets[key]].append(pid)
                counts["will_update"] += 1
            elif current == targets[key]:
                counts["already_correct"] += 1
            else:
                counts["already_set_different"] += 1
                already_set_diff.append((pid, key, current, targets[key]))

        csv_only = {k: g["rows"] for k, g in groups.items() if k not in db_group_size}
        size_mismatch = [
            (k, g["rows"], db_group_size[k])
            for k, g in groups.items()
            if k in db_group_size and g["rows"] != db_group_size[k]
        ]
        return {
            "counts": counts,
            "to_update": to_update,
            "db_only": db_only,
            "csv_only": csv_only,
            "size_mismatch": size_mismatch,
            "already_set_diff": already_set_diff,
        }

    # ── 리포트 ──
    def _report(self, groups, csv_skipped, plan, limit):
        c = plan["counts"]
        w = self.stdout.write
        csv_rows = sum(g["rows"] for g in groups.values())
        skipped_rows = {}
        for key, reason in csv_skipped.items():
            skipped_rows[reason.split(":")[0]] = (
                skipped_rows.get(reason.split(":")[0], 0) + groups[key]["rows"]
            )
        csv_only_rows = sum(plan["csv_only"].values())

        w("\n===== 결과 =====")
        w(f"CSV: {csv_rows}행 / 고유 키 {len(groups)}개")
        for reason, rows in skipped_rows.items():
            w(f"  - 갱신 대상 아님: {reason} ({rows}행)")
        w(f"DB Program: {c['db_total']}행")
        w("")
        w(f"매칭된 DB row               : {c['matched']}")
        w(f"  ├ 업데이트 예정(현재 NULL)  : {c['will_update']}")
        w(f"  ├ 이미 같은 값               : {c['already_correct']}")
        w(f"  ├ 이미 다른 값(건드리지 않음): {c['already_set_different']}")
        w(f"  └ CSV 값이 NULL/부적합이라 미갱신: {c['matched_no_update_csv_null_or_invalid']}")
        w(f"CSV에만 있음(DB에 없음, 생성 안 함): {csv_only_rows}행 / 키 {len(plan['csv_only'])}개")
        w(f"DB에만 있음(CSV에 없음, 건드리지 않음): {c['db_not_in_csv']}행 / 키 {len(plan['db_only'])}개")
        w(f"키별 행 수가 CSV와 DB에서 다른 경우: {len(plan['size_mismatch'])}개 키")

        self._log_list("[미매칭] CSV에는 있고 DB에는 없는 키 (생성하지 않음)",
                       [(k, f"{n}행") for k, n in plan["csv_only"].items()], limit)
        self._log_list("[미매칭] DB에는 있고 CSV에는 없는 키 (건드리지 않음)",
                       [(k, f"{n}행") for k, n in plan["db_only"].items()], limit)
        self._log_list("[주의] 키별 행 수 불일치 (키, CSV행수, DB행수)",
                       [(k, f"CSV {a} / DB {b}") for k, a, b in plan["size_mismatch"]], limit)
        self._log_list("[주의] DB에 이미 다른 subfacility 가 있어 건드리지 않는 row",
                       [((pid, key), f"현재 {cur} / CSV {new}")
                        for pid, key, cur, new in plan["already_set_diff"]], limit)
        problems = [(k, r) for k, r in csv_skipped.items() if "정상 NULL" not in r]
        self._log_list("[주의] CSV 값 문제로 갱신하지 않는 키", problems, limit)

        by_sub = {sid: len(ids) for sid, ids in plan["to_update"].items()}
        w(f"\n업데이트 예정 subfacility_id 종류: {len(by_sub)}개 "
          f"(합계 {sum(by_sub.values())}건)")

    def _log_list(self, title, items, limit):
        if not items:
            return
        self.stdout.write(self.style.WARNING(f"\n{title}: {len(items)}건"))
        for item, note in items[:limit]:
            self.stdout.write(f"  {item}  {note}")
        if len(items) > limit:
            self.stdout.write(f"  ... 외 {len(items) - limit}건 (--log-limit 으로 조정)")

    # ── 반영 ──
    def _apply(self, to_update):
        updated = 0
        with transaction.atomic():
            for sub_id, ids in to_update.items():
                for i in range(0, len(ids), UPDATE_BATCH_SIZE):
                    chunk = ids[i:i + UPDATE_BATCH_SIZE]
                    # 그 사이 값이 채워진 row 는 건드리지 않도록 NULL 조건을 다시 건다.
                    updated += Program.objects.filter(
                        id__in=chunk, subfacility__isnull=True
                    ).update(subfacility_id=sub_id)
        return updated

    def _print_db_target(self):
        db = settings.DATABASES["default"]
        engine = db.get("ENGINE", "").rsplit(".", 1)[-1]
        if engine == "sqlite3":
            target = f"sqlite3 · {db.get('NAME')}"
        else:
            target = f"{engine} · {db.get('NAME')} @ {db.get('HOST') or 'local'}"
        self.stdout.write(f"대상 DB: {target}")
