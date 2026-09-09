from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)

from .serializers import (
    MyProgramSerializer,
    OnedayPostSerializer,
    OnedayApplicationSerializer,
)


# ==========================================
# 내가 현재 수강 중인 프로그램
# ==========================================
@api_view(["GET"])
def myprogram_list(request):

    today = timezone.localdate()


    # ==========================================
    # 현재는 로그인 인증 전이므로
    # 테스트용 user_id = 1 사용
    # ==========================================

    if request.user.is_authenticated:
        user_id = request.user.id
    else:
        user_id = 1


    # ==========================================
    # 현재 수강 중이며 승인된 프로그램만
    # ==========================================

    data = MyProgram.objects.filter(
        user_id=user_id,
        status="approved",
        start_date__lte=today,
        end_date__gte=today,
    ).select_related(
        "user",
        "program",
        "program__facility",
    )


    serializer = MyProgramSerializer(
        data,
        many=True
    )


    return Response(
        serializer.data
    )


# ==========================================
# 원데이 게시글 목록 / 등록
# ==========================================
@api_view(["GET", "POST"])
def onedaypost_list(request):

    # ======================================
    # GET
    # 원데이 게시글 목록
    # ======================================

    if request.method == "GET":

        data = OnedayPost.objects.select_related(
            "enroll",
            "enroll__program",
            "enroll__program__facility",
        ).all().order_by("-created_at")


        serializer = OnedayPostSerializer(
            data,
            many=True
        )


        return Response(
            serializer.data
        )


    # ======================================
    # POST
    # 원데이 게시글 등록
    # ======================================

    if request.method == "POST":

        serializer = OnedayPostSerializer(
            data=request.data
        )


        if serializer.is_valid():

            enroll = serializer.validated_data["enroll"]
            transfer_date = serializer.validated_data["transfer_date"]


            # ==================================
            # 수강 프로그램의 실제 수강기간 확인
            # ==================================

            if (
                transfer_date < enroll.start_date
                or transfer_date > enroll.end_date
            ):

                return Response(
                    {
                        "detail":
                            "수강기간에 포함되지 않는 날짜입니다."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # ==================================
            # 수강 요일 확인
            # ==================================

            weekday_map = {
                0: "월",
                1: "화",
                2: "수",
                3: "목",
                4: "금",
                5: "토",
                6: "일",
            }


            selected_weekday = weekday_map[transfer_date.weekday()]


            program_days = enroll.program_day or ""


            if selected_weekday not in program_days:

                return Response(
                    {
                        "detail":
                            f"{selected_weekday}요일은 수강 요일이 아닙니다."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # ==================================
            # 실제 게시글 DB 저장
            # ==================================

            post = serializer.save(
                status="open"
            )


            # ==================================
            # 저장된 게시글 다시 반환
            # ==================================

            result_serializer = OnedayPostSerializer(post)


            return Response(
                result_serializer.data,
                status=status.HTTP_201_CREATED
            )


# ==========================================
# 원데이 신청 목록
# ==========================================
@api_view(["GET"])
def onedayapplication_list(request):

    data = OnedayApplication.objects.select_related(
        "post",
        "user",
    ).all()


    serializer = OnedayApplicationSerializer(
        data,
        many=True
    )


    return Response(
        serializer.data
    )