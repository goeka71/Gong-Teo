from rest_framework import serializers

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)


# ==========================================
# 내가 등록한 프로그램
# ==========================================
class MyProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyProgram
        fields = "__all__"


# ==========================================
# 원데이 게시글
# ==========================================
class OnedayPostSerializer(serializers.ModelSerializer):

    # ======================================
    # Program 정보
    # ======================================

    # 프로그램명
    program_name = serializers.CharField(
        source="enroll.program.program_name",
        read_only=True
    )

    # 프로그램 요일
    program_day = serializers.CharField(
        source="enroll.program.program_day",
        read_only=True
    )

    # 프로그램 시간
    program_time = serializers.CharField(
        source="enroll.program.program_time",
        read_only=True
    )

    # ======================================
    # Facility 정보
    # ======================================

    # 시설명
    facility_name = serializers.CharField(
        source="enroll.program.facility.facility_name",
        read_only=True
    )

    # 시설 주소
    facility_addr = serializers.CharField(
        source="enroll.program.facility.addr",
        read_only=True
    )

    # 위도
    latit = serializers.FloatField(
        source="enroll.program.facility.latit",
        read_only=True
    )

    # 경도
    longit = serializers.FloatField(
        source="enroll.program.facility.longit",
        read_only=True
    )

    # 가까운 역
    station = serializers.CharField(
        source="enroll.program.facility.station",
        read_only=True
    )

    # 역까지 도보 시간
    station_wt = serializers.IntegerField(
        source="enroll.program.facility.station_wt",
        read_only=True,
        allow_null=True
    )

    # 가까운 버스정류장
    bus = serializers.CharField(
        source="enroll.program.facility.bus",
        read_only=True
    )

    # 버스정류장까지 도보 시간
    bus_wt = serializers.IntegerField(
        source="enroll.program.facility.bus_wt",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = OnedayPost

        fields = [
            # 게시글 기본 정보
            "id",
            "enroll",
            "transfer_date",
            "status",
            "created_at",

            # 프로그램 정보
            "program_name",
            "program_day",
            "program_time",

            # 시설 정보
            "facility_name",
            "facility_addr",

            # GPS 좌표
            "latit",
            "longit",

            # 대중교통 정보
            "station",
            "station_wt",
            "bus",
            "bus_wt",
        ]


# ==========================================
# 원데이 신청
# ==========================================
class OnedayApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnedayApplication
        fields = "__all__"