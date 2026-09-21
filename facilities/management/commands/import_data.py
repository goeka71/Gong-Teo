import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from facilities.models import (
    Facility, Sport, SubFacility, FacilitySport, Program, FacilityDetail
)

# csv들이 있는 폴더 경로
DATA_DIR = os.path.join(settings.BASE_DIR, "data")


def read_csv(filename):
    """csv 파일을 읽어 딕셔너리 리스트로 반환"""
    path = os.path.join(DATA_DIR, filename)
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


class Command(BaseCommand):
    help = "공공데이터 csv를 DB에 import합니다"

    def handle(self, *args, **options):
        if Facility.objects.exists():
            self.stdout.write(self.style.WARNING("이미 데이터 있음, 건너뜀"))
            return

        # 타임아웃 등으로 중간에 실패하면 절반만 들어간 상태로 남기지 않고
        # 전체를 롤백한다.
        with transaction.atomic():
            self._import_all()

        self.stdout.write(self.style.SUCCESS("\n=== 전체 import 완료 ==="))

    def _import_all(self):
        # ── 1. 부모 테이블 먼저 (id 직접 지정) ──

        # Facility
        rows = read_csv("facility.csv")
        self._log_start("Facility", len(rows))
        for i, row in enumerate(rows, 1):
            Facility.objects.create(
                id=int(row["id"]),                    # id 직접 지정
                facility_name=row["facility_name"],
                addr=row["addr"],
                latit=float(row["latit"]),
                longit=float(row["longit"]),
                station=row.get("station") or "",
                bus=row.get("bus") or "",
                station_wt=self._to_int(row.get("station_wt")),
                bus_wt=self._to_int(row.get("bus_wt")),
            )
            self._log_progress("Facility", i, len(rows))
        self.stdout.write(self.style.SUCCESS(f"Facility {len(rows)}개 완료"))

        # Sport
        rows = read_csv("sport.csv")
        self._log_start("Sport", len(rows))
        for i, row in enumerate(rows, 1):
            Sport.objects.create(
                id=int(row["id"]),                    # id 직접 지정
                sport_name=row["sport_name"],
            )
            self._log_progress("Sport", i, len(rows))
        self.stdout.write(self.style.SUCCESS(f"Sport {len(rows)}개 완료"))

        # ── 2. 자식 테이블 (id 자동, 부모 참조) ──
        # (Program 의 세부시설은 아래에서 SubFacility 를 만든 뒤 그 id 로 연결한다)

        # SubFacility
        rows = read_csv("subfacility.csv")
        self._log_start("SubFacility", len(rows))
        # program.csv 의 subfacility_id 는 "subfacility.csv 의 N번째 행" 을 뜻한다.
        # 실제 DB id 는 시퀀스 상태에 따라 N 과 다를 수 있어서(예: Postgres 는
        # 롤백돼도 시퀀스가 되돌아가지 않는다) 만들어진 id 와 시설을 CSV 순서대로
        # 기록해 두었다가 Program 을 만들 때 변환한다.
        subfacilities = []  # [(실제 id, facility_id), ...]  N번째 행 = subfacilities[N-1]
        for i, row in enumerate(rows, 1):
            subfacility = SubFacility.objects.create(
                facility_id=int(row["facility_id"]),
                subfacility_name=row["subfacility_name"],
            )
            subfacilities.append((subfacility.id, subfacility.facility_id))
            self._log_progress("SubFacility", i, len(rows))
        self.stdout.write(self.style.SUCCESS(f"SubFacility {len(rows)}개 완료"))

        # FacilitySport
        rows = read_csv("facility_sport.csv")
        self._log_start("FacilitySport", len(rows))
        for i, row in enumerate(rows, 1):
            FacilitySport.objects.create(
                facility_id=int(row["facility_id"]),
                sport_id=int(row["sport_id"]),
            )
            self._log_progress("FacilitySport", i, len(rows))
        self.stdout.write(self.style.SUCCESS(f"FacilitySport {len(rows)}개 완료"))

        # Program (건수가 훨씬 많아서 bulk_create로 처리)
        rows = read_csv("program.csv")
        total = len(rows)
        self._log_start("Program", total)
        BATCH_SIZE = 1000
        batch = []
        created = 0
        linked = 0
        unlinked = 0  # csv 에 세부시설이 적혀 있는데 연결하지 못한 행
        for row in rows:
            facility_id = int(row["facility_id"])
            subfacility_id, ok = self._resolve_subfacility(
                row.get("subfacility_id"), facility_id, subfacilities
            )
            if subfacility_id is not None:
                linked += 1
            elif not ok:
                unlinked += 1
            batch.append(Program(
                facility_id=facility_id,
                subfacility_id=subfacility_id,
                program_name=row["program_name"],
                program_day=row.get("program_day") or "",
                program_cap=self._to_int(row.get("program_cap")),
                program_time=row.get("program_time") or "",
            ))
            if len(batch) >= BATCH_SIZE:
                Program.objects.bulk_create(batch, batch_size=BATCH_SIZE)
                created += len(batch)
                batch = []
                self._log_progress("Program", created, total)
        if batch:
            Program.objects.bulk_create(batch, batch_size=BATCH_SIZE)
            created += len(batch)
        self.stdout.write(self.style.SUCCESS(
            f"Program {total}개 완료 (세부시설 연결 {linked}개)"
        ))
        if unlinked:
            self.stdout.write(self.style.WARNING(
                f"세부시설 번호가 잘못된 Program {unlinked}개는 세부시설 없이 넣었습니다."
            ))

        # FacilityDetail
        rows = read_csv("facility_detail.csv")
        self._log_start("FacilityDetail", len(rows))
        for i, row in enumerate(rows, 1):
            FacilityDetail.objects.create(
                facility_id=int(row["facility_id"]),
                phone=row.get("phone") or "",
                website=row.get("website") or "",
                in_out=row.get("in_out") or "",
                op_hour=row.get("op_hour") or "",
                fee=row.get("fee") or "",
                shower=self._to_bool(row.get("shower")),
                parking=self._to_bool(row.get("parking")),
            )
            self._log_progress("FacilityDetail", i, len(rows))
        self.stdout.write(self.style.SUCCESS(f"FacilityDetail {len(rows)}개 완료"))

    # ── 도우미 함수들 ──
    def _log_start(self, name, total):
        self.stdout.write(f"[{name}] {total}건 처리 시작...")
        self.stdout.flush()

    def _log_progress(self, name, current, total):
        # 진행 상황이 안 보이는 것처럼 보이지 않도록 일정 간격으로 출력
        step = max(1, min(2000, total // 5))
        if current % step == 0 or current == total:
            self.stdout.write(f"[{name}] {current}/{total}건 처리 중...")
            self.stdout.flush()

    def _to_int(self, value):
        """빈 값이나 숫자 아닌 것은 None으로"""
        if value is None or str(value).strip() == "":
            return None
        try:
            return int(float(value))
        except ValueError:
            return None

    def _resolve_subfacility(self, value, facility_id, subfacilities):
        """program.csv 의 subfacility_id(=subfacility.csv 의 N번째 행)를 실제 DB id 로 바꾼다.

        (실제 id, 정상 여부) 를 돌려준다.
        - 값이 비어 있거나 컬럼이 없으면 (None, True): 세부시설이 없는 프로그램이다.
        - 숫자가 아니거나, 번호가 범위를 벗어나거나, 다른 시설의 세부시설이면
          (None, False): 잘못된 값.
        """
        if value is None or str(value).strip() == "":
            return None, True

        number = self._to_int(value)

        if number is None or not 1 <= number <= len(subfacilities):
            return None, False

        subfacility_id, subfacility_facility_id = subfacilities[number - 1]

        if subfacility_facility_id != facility_id:
            return None, False

        return subfacility_id, True

    def _to_bool(self, value):
        """'True'/'False' 문자열을 불리언으로"""
        return str(value).strip().lower() in ("true", "1", "yes")