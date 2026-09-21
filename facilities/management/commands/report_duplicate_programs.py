from collections import Counter

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Count, Min

from facilities.models import Program, Review
from oneday.models import MyProgram, OnedayApplication, OnedayPost

# 이 다섯 컬럼이 모두 같으면 "완전 동일" 중복으로 본다.
# subfacility 는 일부러 뺐다. CSV 기준으로 (시설, 이름) 하나는 항상 한 세부시설에만
# 속하고, DB 가 일부만 backfill 된 상태여도 같은 그룹으로 묶여야 하기 때문이다.
# (세부시설 값이 섞인 그룹은 아래에서 따로 세어 보고한다.)
KEY_FIELDS = (
    "facility_id",
    "program_name",
    "program_day",
    "program_cap",
    "program_time",
)

# id 목록을 IN (...) 으로 넘길 때 한 번에 묶는 크기. (SQLite 변수 개수 제한 대비)
IN_CHUNK_SIZE = 500


def chunks(items, size=IN_CHUNK_SIZE):
    items = list(items)
    for start in range(0, len(items), size):
        yield items[start:start + size]


class Command(BaseCommand):
    help = (
        "Program 테이블의 '완전 동일' 중복 행 현황을 보고합니다. "
        "DB를 읽기만 하고 절대 변경하지 않습니다. "
        "(중복 제거 전에 삭제 대상 규모와 참조/연쇄삭제 영향을 확인하는 용도)"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--top",
            type=int,
            default=5,
            help="가장 많이 반복되는 그룹을 몇 개까지 보여줄지 (기본 5)",
        )

    def handle(self, *args, **options):
        self._print_db_target()
        self.stdout.write(
            self.style.WARNING("[READ-ONLY] 이 커맨드는 DB를 변경하지 않습니다.")
        )

        total = Program.objects.count()
        groups = self._duplicate_groups()

        self._report_summary(total, groups, options["top"])
        self._report_subfacility(groups)
        self._report_references(groups)
        self._report_name_collisions()

    # ------------------------------------------------------------------
    # 중복 그룹 계산
    # ------------------------------------------------------------------
    def _duplicate_groups(self):
        """KEY_FIELDS 가 모두 같은 행이 2개 이상인 그룹을 {키: 정보} 로 돌려준다.

        keeper 는 그룹에서 남길 행(가장 작은 id) 이다.
        """
        rows = (
            Program.objects.values(*KEY_FIELDS)
            .annotate(
                n=Count("id"),
                keeper=Min("id"),
                sub_filled=Count("subfacility"),
                sub_kinds=Count("subfacility", distinct=True),
            )
            .filter(n__gt=1)
            .order_by()
        )
        return {tuple(row[f] for f in KEY_FIELDS): row for row in rows}

    # ------------------------------------------------------------------
    # 리포트
    # ------------------------------------------------------------------
    def _report_summary(self, total, groups, top):
        deletable = sum(g["n"] - 1 for g in groups.values())

        self.stdout.write("\n[1] 중복 규모")
        self.stdout.write(f"  Program 전체 행           : {total:,}")
        self.stdout.write(f"  중복 그룹 수 (2행 이상)   : {len(groups):,}")
        self.stdout.write(f"  삭제 대상 행 (그룹당 1행만 남김): {deletable:,}")
        self.stdout.write(f"  정리 후 예상 행 수        : {total - deletable:,}")

        if not groups:
            return

        self.stdout.write(f"\n  가장 많이 반복되는 그룹 상위 {top}개")
        largest = sorted(groups.values(), key=lambda g: g["n"], reverse=True)[:top]
        for g in largest:
            name = g["program_name"]
            if len(name) > 40:
                name = name[:40] + "…"
            self.stdout.write(
                f"    {g['n']:>4}회  시설 {g['facility_id']}  {name}  "
                f"({g['program_day']} / {g['program_time'] or '시간 없음'})"
            )

    def _report_subfacility(self, groups):
        null_rows = Program.objects.filter(subfacility__isnull=True).count()
        mixed = [g for g in groups.values() if 0 < g["sub_filled"] < g["n"]]
        multi = [g for g in groups.values() if g["sub_kinds"] > 1]

        self.stdout.write("\n[2] 세부시설(subfacility) 상태")
        self.stdout.write(f"  subfacility 가 NULL 인 행         : {null_rows:,}")
        self.stdout.write(f"  NULL 과 값이 섞인 중복 그룹        : {len(mixed):,}")
        self.stdout.write(f"  서로 다른 세부시설이 섞인 중복 그룹: {len(multi):,}")

        if mixed or multi:
            self.stdout.write(self.style.WARNING(
                "  ※ 0 이 아니면 '가장 작은 id 를 남긴다' 규칙만으로는 부족합니다. "
                "삭제 전에 대표 행 선정 규칙을 다시 정해야 합니다."
            ))

    def _report_references(self, groups):
        """삭제 대상 행을 가리키는 MyProgram / Review 가 얼마나 되는지 센다."""
        my_program_ids = set(
            MyProgram.objects.values_list("program_id", flat=True)
        )
        review_program_ids = set(
            Review.objects.filter(program__isnull=False)
            .values_list("program_id", flat=True)
        )
        referenced = my_program_ids | review_program_ids

        # 참조된 Program 중, 그룹의 대표(keeper)가 아닌 것 = 삭제 대상이면서 참조됨.
        movable = set()
        for batch in chunks(referenced):
            for row in Program.objects.filter(id__in=batch).values("id", *KEY_FIELDS):
                group = groups.get(tuple(row[f] for f in KEY_FIELDS))
                if group and group["keeper"] != row["id"]:
                    movable.add(row["id"])

        my_programs = posts = applications = reviews = 0
        for batch in chunks(movable):
            my_programs += MyProgram.objects.filter(program_id__in=batch).count()
            posts += OnedayPost.objects.filter(enroll__program_id__in=batch).count()
            applications += OnedayApplication.objects.filter(
                post__enroll__program_id__in=batch
            ).count()
            reviews += Review.objects.filter(program_id__in=batch).count()

        self.stdout.write("\n[3] 참조 현황")
        self.stdout.write(f"  Program 을 가리키는 MyProgram 행  : {MyProgram.objects.count():,}")
        self.stdout.write(f"  Program 을 가리키는 Review 행     : "
                          f"{Review.objects.filter(program__isnull=False).count():,}")
        self.stdout.write(f"  참조가 있는 Program 수            : {len(referenced):,}")
        self.stdout.write(
            f"  그중 삭제 대상이라 대표 행으로 옮겨야 하는 Program: {len(movable):,}"
        )
        self.stdout.write(
            "  옮기지 않고 그대로 삭제하면 함께 사라지거나 바뀌는 데이터"
        )
        self.stdout.write(f"    MyProgram (수강 등록, CASCADE 삭제)      : {my_programs:,}")
        self.stdout.write(f"    OnedayPost (양도 게시글, CASCADE 삭제)   : {posts:,}")
        self.stdout.write(f"    OnedayApplication (원데이 신청, CASCADE 삭제): {applications:,}")
        self.stdout.write(f"    Review (프로그램 리뷰 → 시설 리뷰로 변경): {reviews:,}")

    def _report_name_collisions(self):
        """완전 동일 중복을 제거한 뒤에도 (시설, 이름)이 겹치는 경우를 센다.

        이런 이름은 요일/시간/정원이 달라 서로 다른 행으로 남는다. 직접 입력 등록
        (users/views.py my_programs)은 같은 시설+세부시설+이름의 Program 이 여러 개면
        가장 작은 id 를 재사용한다.
        """
        kinds = Counter()
        combos = Program.objects.values(*KEY_FIELDS).distinct().order_by()
        for row in combos:
            kinds[(row["facility_id"], row["program_name"])] += 1

        collided = sum(1 for count in kinds.values() if count > 1)

        self.stdout.write("\n[4] 정리 후에도 남는 '이름만 같은' 경우")
        self.stdout.write(f"  (시설, 이름) 조합 수                : {len(kinds):,}")
        self.stdout.write(f"  그중 요일/시간/정원이 달라 2행 이상 남는 조합: {collided:,}")

        self.stdout.write(self.style.SUCCESS(
            "\n[READ-ONLY] 완료. DB는 변경되지 않았습니다."
        ))

    # ------------------------------------------------------------------
    def _print_db_target(self):
        db = settings.DATABASES["default"]
        engine = db.get("ENGINE", "").rsplit(".", 1)[-1]
        if engine == "sqlite3":
            target = f"sqlite3 · {db.get('NAME')}"
        else:
            target = f"{engine} · {db.get('NAME')} @ {db.get('HOST') or 'local'}"
        self.stdout.write(f"대상 DB: {target}")
