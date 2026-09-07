from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User, CoinHistory
from .serializers import (
    UserSerializer,
    SignupSerializer,
    UserUpdateSerializer,
    CoinHistorySerializer,
    MyProgramSerializer,
    MyProgramCreateSerializer,
)

from oneday.models import MyProgram
from facilities.models import Facility, Program


# =========================================================
# 사용자 목록
# =========================================================
@api_view(["GET"])
def user_list(request):
    data = User.objects.all()
    serializer = UserSerializer(data, many=True)

    return Response(serializer.data)


# =========================================================
# 회원가입
# =========================================================
@api_view(["POST"])
def signup(request):
    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


# =========================================================
# 코인 내역
# =========================================================
@api_view(["GET"])
def coin_history_list(request):
    data = CoinHistory.objects.all()
    serializer = CoinHistorySerializer(data, many=True)

    return Response(serializer.data)


# =========================================================
# 내 정보 조회 / 수정
# =========================================================
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def my_info(request):

    if request.method == "GET":
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    serializer = UserUpdateSerializer(
        request.user,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()

        return Response(
            UserSerializer(request.user).data
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


# =========================================================
# 나의 수강 프로그램 조회 / 등록
# =========================================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_programs(request):

    # -----------------------------------------------------
    # GET
    # 내가 등록한 수강 프로그램 조회
    # -----------------------------------------------------
    if request.method == "GET":
        programs = (
            MyProgram.objects
            .filter(user=request.user)
            .select_related(
                "program",
                "program__facility",
                "subfacility",
            )
            .order_by("-id")
        )

        serializer = MyProgramSerializer(
            programs,
            many=True
        )

        return Response(serializer.data)

    # -----------------------------------------------------
    # POST
    # 수강 프로그램 등록
    # -----------------------------------------------------
    serializer = MyProgramCreateSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_data = serializer.validated_data

    # 기존 프로그램을 선택했는지 확인
    program = validated_data.get("program")

    # -----------------------------------------------------
    # 기존 프로그램이 아니라
    # 사용자가 프로그램명을 직접 입력한 경우
    # -----------------------------------------------------
    if program is None:
        facility_id = validated_data.pop("facility")
        new_program_name = validated_data.pop(
            "new_program_name"
        ).strip()

        subfacility = validated_data.get(
            "subfacility"
        )

        facility = Facility.objects.get(
            pk=facility_id
        )

        # 같은 시설 + 같은 세부시설 + 같은 프로그램명이
        # 이미 있으면 기존 Program 재사용
        program, created = Program.objects.get_or_create(
            facility=facility,
            subfacility=subfacility,
            program_name=new_program_name,
            defaults={
                "program_day": validated_data.get(
                    "program_day",
                    ""
                ),
                "program_time": validated_data.get(
                    "program_time",
                    ""
                ),
            },
        )

    # -----------------------------------------------------
    # 기존 프로그램을 선택한 경우
    # 직접입력 전용 필드는 제거
    # -----------------------------------------------------
    else:
        validated_data.pop("facility", None)
        validated_data.pop("new_program_name", None)

    # serializer에서 받은 program은
    # 아래에서 직접 넣을 것이므로 제거
    validated_data.pop("program", None)

    # -----------------------------------------------------
    # 로그인한 사용자의 MyProgram 생성
    # -----------------------------------------------------
    my_program = MyProgram.objects.create(
        user=request.user,
        program=program,
        **validated_data
    )

    return Response(
        MyProgramSerializer(my_program).data,
        status=status.HTTP_201_CREATED,
    )