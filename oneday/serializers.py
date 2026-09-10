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

    # 프로그램명
    program_name = serializers.CharField(
        source="program.program_name",
        read_only=True
    )

    # 프로그램 기본 요일
    program_default_day = serializers.CharField(
        source="program.program_day",
        read_only=True
    )

    # 프로그램 기본 시간
    program_default_time = serializers.CharField(
        source="program.program_time",
        read_only=True
    )

    # 시설명
    facility_name = serializers.CharField(
        source="program.facility.facility_name",
        read_only=True
    )

    # 시설 주소
    facility_addr = serializers.CharField(
        source="program.facility.addr",
        read_only=True
    )

    class Meta:
        model = MyProgram

        fields = [
            "id",
            "user",
            "program",

            "start_date",
            "end_date",

            "program_day",
            "program_time",

            "status",
            "reject_reason",

            "program_name",
            "program_default_day",
            "program_default_time",

            "facility_name",
            "facility_addr",
        ]


# ==========================================
# 원데이 게시글
# ==========================================
class OnedayPostSerializer(serializers.ModelSerializer):

    # ======================================
    # Program 정보
    # ======================================

    program_name = serializers.CharField(
        source="enroll.program.program_name",
        read_only=True
    )

    program_day = serializers.CharField(
        source="enroll.program_day",
        read_only=True
    )

    program_time = serializers.CharField(
        source="enroll.program_time",
        read_only=True
    )


    # ======================================
    # Facility 정보
    # ======================================

    facility_name = serializers.CharField(
        source="enroll.program.facility.facility_name",
        read_only=True
    )

    facility_addr = serializers.CharField(
        source="enroll.program.facility.addr",
        read_only=True
    )


    # 위도
    latit = serializers.FloatField(
        source="enroll.program.facility.latit",
        read_only=True,
        allow_null=True
    )


    # 경도
    longit = serializers.FloatField(
        source="enroll.program.facility.longit",
        read_only=True,
        allow_null=True
    )


    # 가까운 역
    station = serializers.CharField(
        source="enroll.program.facility.station",
        read_only=True,
        allow_blank=True
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
        read_only=True,
        allow_blank=True
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

            # GPS
            "latit",
            "longit",

            # 대중교통
            "station",
            "station_wt",
            "bus",
            "bus_wt",
        ]

        read_only_fields = [
            "created_at",
        ]


# ==========================================
# 원데이 신청
# ==========================================
class OnedayApplicationSerializer(serializers.ModelSerializer):

    class Meta:
        model = OnedayApplication

        fields = "__all__"