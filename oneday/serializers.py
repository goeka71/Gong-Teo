from rest_framework import serializers

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)


# ==========================
# 내 수강 프로그램 Serializer
# ==========================

class MyProgramSerializer(serializers.ModelSerializer):

    # 프로그램 이름
    program_name = serializers.CharField(
        source="program.program_name",
        read_only=True
    )

    # 시설 이름
    facility_name = serializers.CharField(
        source="program.facility.facility_name",
        read_only=True
    )

    class Meta:
        model = MyProgram

        fields = [
            "id",
            "program",
            "program_name",
            "facility_name",
            "program_day",
            "program_time",
            "start_date",
            "end_date",
            "status",
            "user",
        ]


# ==========================
# 원데이 양도 게시글 Serializer
# ==========================

class OnedayPostSerializer(serializers.ModelSerializer):

    # 프로그램 이름
    program_name = serializers.CharField(
        source="enroll.program.program_name",
        read_only=True
    )

    # 시설 이름
    facility_name = serializers.CharField(
        source="enroll.program.facility.facility_name",
        read_only=True
    )

    # 수강 요일
    program_day = serializers.CharField(
        source="enroll.program_day",
        read_only=True
    )

    # 수업 시간
    program_time = serializers.CharField(
        source="enroll.program_time",
        read_only=True
    )

    class Meta:
        model = OnedayPost

        fields = [
            "id",
            "program_name",
            "facility_name",
            "program_day",
            "transfer_date",
            "program_time",
            "status",
            "created_at",
            "enroll",
        ]

        read_only_fields = [
            "created_at",
        ]


# ==========================
# 원데이 양도 신청 Serializer
# ==========================

class OnedayApplicationSerializer(serializers.ModelSerializer):

    class Meta:
        model = OnedayApplication
        fields = "__all__"