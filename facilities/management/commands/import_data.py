import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
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
        # ── 1. 부모 테이블 먼저 (id 직접 지정) ──

        # Facility
        rows = read_csv("facility.csv")
        for row in rows:
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
        self.stdout.write(self.style.SUCCESS(f"Facility {len(rows)}개 완료"))

        # Sport
        rows = read_csv("sport.csv")
        for row in rows:
            Sport.objects.create(
                id=int(row["id"]),                    # id 직접 지정
                sport_name=row["sport_name"],
            )
        self.stdout.write(self.style.SUCCESS(f"Sport {len(rows)}개 완료"))

        # ── 2. 자식 테이블 (id 자동, 부모 참조) ──

        # SubFacility
        rows = read_csv("subfacility.csv")
        for row in rows:
            SubFacility.objects.create(
                facility_id=int(row["facility_id"]),
                subfacility_name=row["subfacility_name"],
            )
        self.stdout.write(self.style.SUCCESS(f"SubFacility {len(rows)}개 완료"))

        # FacilitySport
        rows = read_csv("facility_sport.csv")
        for row in rows:
            FacilitySport.objects.create(
                facility_id=int(row["facility_id"]),
                sport_id=int(row["sport_id"]),
            )
        self.stdout.write(self.style.SUCCESS(f"FacilitySport {len(rows)}개 완료"))

        # Program
        rows = read_csv("program.csv")
        for row in rows:
            Program.objects.create(
                facility_id=int(row["facility_id"]),
                program_name=row["program_name"],
                program_day=row.get("program_day") or "",
                program_cap=self._to_int(row.get("program_cap")),
                program_time=row.get("program_time") or "",
            )
        self.stdout.write(self.style.SUCCESS(f"Program {len(rows)}개 완료"))

        # FacilityDetail
        rows = read_csv("facility_detail.csv")
        for row in rows:
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
        self.stdout.write(self.style.SUCCESS(f"FacilityDetail {len(rows)}개 완료"))

        self.stdout.write(self.style.SUCCESS("\n=== 전체 import 완료 ==="))

    # ── 도우미 함수들 ──
    def _to_int(self, value):
        """빈 값이나 숫자 아닌 것은 None으로"""
        if value is None or str(value).strip() == "":
            return None
        try:
            return int(float(value))
        except ValueError:
            return None

    def _to_bool(self, value):
        """'True'/'False' 문자열을 불리언으로"""
        return str(value).strip().lower() in ("true", "1", "yes")