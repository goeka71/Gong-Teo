import re

from datetime import datetime, time

from django.utils import timezone
from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from users.models import User, CoinHistory

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
# 원데이 게시글 만료(노출 종료) 시점 계산
#
# "program_time" 은 "07:00 - 08:00" 형태의 문자열이라
# DB 쿼리만으로 걸러낼 수 없어 파이썬에서 직접 계산한다.
# 시작 시간을 파싱하지 못하면 안전하게 그 날 자정 직전까지로 본다.
# ==========================================
PROGRAM_START_TIME_PATTERN = re.compile(r"^(\d{1,2}):(\d{2})")


def _get_post_expire_datetime(post):

    program_time = (post.enroll.program_time or "").strip()

    match = PROGRAM_START_TIME_PATTERN.match(program_time)

    if match:
        hour = int(match.group(1))
        minute = int(match.group(2))
    else:
        hour, minute = 23, 59

    naive_expire_at = datetime.combine(
        post.transfer_date,
        time(hour, minute),
    )

    return timezone.make_aware(
        naive_expire_at,
        timezone.get_current_timezone(),
    )


def _is_post_expired(post, now):
    return _get_post_expire_datetime(post) <= now


# ==========================================
# 내가 현재 수강 중인 프로그램
# ==========================================
@api_view(["GET"])
def myprogram_list(request):

    today = timezone.localdate()


    # ==========================================
    # 로그인 사용자 확인
    # 현재 기존 테스트 구조 유지
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

        now = timezone.now()

        data = OnedayPost.objects.select_related(
            "enroll",
            "enroll__program",
            "enroll__program__facility",
        ).all().order_by("-created_at")


        # ==================================
        # 원데이클래스 날짜/시작 시간이 지난 게시글은
        # 목록에서 제외 (모집중/마감 상태 모두 적용)
        # ==================================

        active_posts = [
            post for post in data
            if not _is_post_expired(post, now)
        ]


        serializer = OnedayPostSerializer(
            active_posts,
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


            selected_weekday = weekday_map[
                transfer_date.weekday()
            ]


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

            result_serializer = OnedayPostSerializer(
                post
            )


            return Response(
                result_serializer.data,
                status=status.HTTP_201_CREATED
            )


        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# 원데이 신청 목록 / 신청하기
# ==========================================
@api_view(["GET", "POST"])
def onedayapplication_list(request):

    # ======================================
    # GET
    # 원데이 신청 목록
    # ======================================

    if request.method == "GET":

        # ==================================
        # 로그인 사용자 확인
        # 현재 기존 테스트 구조 유지
        # ==================================

        if request.user.is_authenticated:
            user_id = request.user.id
        else:
            user_id = 1


        data = OnedayApplication.objects.filter(
            user_id=user_id,
        ).select_related(
            "post",
            "post__enroll",
            "post__enroll__program",
            "post__enroll__program__facility",
            "post__enroll__subfacility",
            "user",
        ).order_by("-apply_at")


        serializer = OnedayApplicationSerializer(
            data,
            many=True
        )


        return Response(
            serializer.data
        )


    # ======================================
    # POST
    # 원데이 신청하기
    #
    # 신청 성공 = 양도 성사
    #
    # 신청자(양도받는 사람) : -1 coin
    # 게시자(양도하는 사람) : +2 coin
    # ======================================

    if request.method == "POST":

        post_id = request.data.get("post")


        # ==================================
        # post 값 확인
        # ==================================

        if not post_id:

            return Response(
                {
                    "detail":
                        "post는 필수입니다."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # ==================================
        # 로그인 사용자 확인
        # ==================================

        if request.user.is_authenticated:

            user_id = request.user.id

        else:

            # 기존 테스트 구조를 유지하기 위해
            # 비로그인 상태에서는 user 1 사용
            user_id = 1


        # ==================================
        # 트랜잭션 시작
        #
        # 신청 생성
        # 코인 차감/적립
        # 코인 내역 생성
        # 게시글 마감
        #
        # 전부 한 번에 처리
        # ==================================

        with transaction.atomic():

            # ==================================
            # 게시글 조회
            # ==================================

            try:

                post = (
                    OnedayPost.objects
                    .select_for_update()
                    .select_related(
                        "enroll",
                        "enroll__user",
                        "enroll__program",
                        "enroll__program__facility",
                    )
                    .get(id=post_id)
                )

            except OnedayPost.DoesNotExist:

                return Response(
                    {
                        "detail":
                            "존재하지 않는 게시글입니다."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )


            # ==================================
            # 이미 마감된 글인지 확인
            # ==================================

            if post.status != "open":

                return Response(
                    {
                        "detail":
                            "이미 마감된 원데이입니다."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # ==================================
            # 본인 게시글 신청 방지
            # ==================================

            if post.enroll.user_id == user_id:

                return Response(
                    {
                        "detail":
                            "본인이 작성한 원데이는 신청할 수 없습니다."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # ==================================
            # 양도받는 사용자 조회
            # ==================================

            try:

                receiver = (
                    User.objects
                    .select_for_update()
                    .get(id=user_id)
                )

            except User.DoesNotExist:

                return Response(
                    {
                        "detail":
                            "사용자 정보를 찾을 수 없습니다."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )


            # ==================================
            # 양도하는 사용자 조회
            # ==================================

            try:

                giver = (
                    User.objects
                    .select_for_update()
                    .get(
                        id=post.enroll.user_id
                    )
                )

            except User.DoesNotExist:

                return Response(
                    {
                        "detail":
                            "양도자 정보를 찾을 수 없습니다."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )


            # ==================================
            # 신청자 코인 확인
            #
            # 양도받으려면 최소 1 coin 필요
            # ==================================

            if receiver.coin < 1:

                return Response(
                    {
                        "detail":
                            "코인이 부족합니다. "
                            "원데이를 양도받으려면 "
                            "1코인이 필요합니다."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # ==================================
            # 원데이 신청 생성
            #
            # 신청과 동시에 assigned
            # ==================================

            OnedayApplication.objects.create(
                post=post,
                user=receiver,
                apply_result="assigned",
            )


            # ==================================
            # 신청자
            # 양도받기 성공 → -1 coin
            # ==================================

            receiver.coin -= 1

            receiver.save(
                update_fields=[
                    "coin"
                ]
            )


            # ==================================
            # 신청자 코인 내역
            # ==================================

            CoinHistory.objects.create(
                user=receiver,
                coin_desc=(
                    f"{post.enroll.program.program_name} "
                    "양도받기 (-1)"
                ),
                coin_res=receiver.coin,
            )


            # ==================================
            # 양도자
            # 양도 성공 → +2 coin
            # ==================================

            giver.coin += 2

            giver.save(
                update_fields=[
                    "coin"
                ]
            )


            # ==================================
            # 양도자 코인 내역
            # ==================================

            CoinHistory.objects.create(
                user=giver,
                coin_desc=(
                    f"{post.enroll.program.program_name} "
                    "양도 완료 (+2)"
                ),
                coin_res=giver.coin,
            )


            # ==================================
            # 게시글 마감
            # ==================================

            post.status = "closed"

            post.save(
                update_fields=[
                    "status"
                ]
            )


        # ==================================
        # 처리 완료된 게시글 반환
        # ==================================

        result_serializer = OnedayPostSerializer(
            post
        )


        return Response(
            result_serializer.data,
            status=status.HTTP_201_CREATED
        )