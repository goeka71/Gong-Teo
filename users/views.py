import logging
import random
import string

from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.db import transaction

logger = logging.getLogger(__name__)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User, CoinHistory, PasswordResetCode
from .serializers import (
    UserSerializer,
    SignupSerializer,
    UserUpdateSerializer,
    CoinHistorySerializer,
    MyProgramSerializer,
    MyProgramCreateSerializer,
    MyReviewSerializer,
    PasswordResetSendCodeSerializer,
    PasswordResetConfirmSerializer,
)

from oneday.models import MyProgram
from facilities.models import Facility, Program, Review


@api_view(["GET"])
def user_list(request):
    data = User.objects.all()
    serializer = UserSerializer(data, many=True)
    return Response(serializer.data)


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


@api_view(["POST"])
def password_reset_send_code(request):
    serializer = PasswordResetSendCodeSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = serializer.validated_data["email"]
    user = User.objects.filter(email=email).order_by("id").first()

    if user is None:
        return Response(
            {"detail": "해당 이메일로 가입된 계정을 찾을 수 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    code = "".join(
        random.choices(string.ascii_uppercase + string.digits, k=6)
    )

    PasswordResetCode.objects.create(user=user, code=code)

    from_email = f"GongTeo <{settings.DEFAULT_FROM_EMAIL}>"

    try:
        send_mail(
            subject="공 [터] 비밀번호 재설정 인증번호",
            message=(
                f"회원님의 아이디는 {user.username} 입니다.\n\n"
                f"인증번호는 {code} 입니다.\n"
                f"인증번호는 발급 후 {PasswordResetCode.CODE_VALID_MINUTES}분간 유효합니다."
            ),
            from_email=from_email,
            recipient_list=[email],
        )
    except Exception:
        logger.exception("비밀번호 재설정 이메일 발송 실패 (email=%s)", email)
        return Response(
            {"detail": "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {"detail": "인증번호가 이메일로 발송되었습니다."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = serializer.validated_data["user"]
    reset_code = serializer.validated_data["reset_code"]

    user.set_password(serializer.validated_data["new_password"])
    user.save()

    reset_code.is_used = True
    reset_code.save(update_fields=["is_used"])

    return Response(
        {"detail": "비밀번호가 변경되었습니다."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def coin_history_list(request):
    histories = (
        CoinHistory.objects
        .filter(user=request.user)
        .order_by("-created_at")
    )

    serializer = CoinHistorySerializer(
        histories,
        many=True
    )

    return Response({
        "coin": request.user.coin,
        "histories": serializer.data,
    })


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def my_info(request):
    if request.method == "GET":
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    if request.method == "DELETE":
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = UserUpdateSerializer(
        request.user,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_programs(request):
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

    serializer = MyProgramCreateSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_data = serializer.validated_data
    program = validated_data.get("program")

    if program is None:
        facility_id = validated_data.pop("facility")
        new_program_name = validated_data.pop(
            "new_program_name"
        ).strip()

        subfacility = validated_data.get(
            "subfacility"
        )

        facility = get_object_or_404(
            Facility,
            pk=facility_id
        )

        program, created = Program.objects.get_or_create(
            facility=facility,
            subfacility=subfacility,
            program_name=new_program_name,
            defaults={
                "program_day":
                    validated_data.get(
                        "program_day",
                        ""
                    ),
                "program_time":
                    validated_data.get(
                        "program_time",
                        ""
                    ),
            },
        )

    else:
        validated_data.pop(
            "facility",
            None
        )
        validated_data.pop(
            "new_program_name",
            None
        )

    validated_data.pop(
        "program",
        None
    )

    my_program = MyProgram.objects.create(
        user=request.user,
        program=program,
        **validated_data
    )

    return Response(
        MyProgramSerializer(
            my_program
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_reviews(request):
    """
    GET  : 로그인한 사용자가 작성한 리뷰 목록
           ?has_photo=true 로 사진 첨부된 리뷰만 필터링 가능
    POST : 로그인한 사용자의 새 리뷰 작성
           새 리뷰 작성 성공 시 코인 +1
    """

    if request.method == "GET":
        reviews = (
            Review.objects
            .filter(user=request.user)
            .select_related(
                "facility",
                "subfacility",
            )
            .order_by("-created_at")
        )

        has_photo = request.GET.get("has_photo")

        if has_photo in ("true", "1"):
            reviews = reviews.filter(
                image__isnull=False
            ).exclude(image="")

        serializer = MyReviewSerializer(
            reviews,
            many=True
        )

        return Response(
            serializer.data
        )

    serializer = MyReviewSerializer(
        data=request.data
    )

    if serializer.is_valid():
        with transaction.atomic():
            review = serializer.save(
                user=request.user
            )

            request.user.coin += 1
            request.user.save(
                update_fields=["coin"]
            )

            CoinHistory.objects.create(
                user=request.user,
                coin_desc="리뷰 작성 (+1)",
                coin_res=request.user.coin,
            )

        return Response(
            MyReviewSerializer(
                review
            ).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def my_review_detail(
    request,
    review_id
):
    """
    PATCH  : 내가 작성한 리뷰 수정
    DELETE : 내가 작성한 리뷰 삭제
    """

    review = get_object_or_404(
        Review,
        id=review_id,
        user=request.user
    )

    if request.method == "PATCH":
        serializer = MyReviewSerializer(
            review,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            review = serializer.save()

            # "사진 삭제" 버튼용. 새 이미지 파일이 같이 오면 그쪽이 우선이고,
            # remove_image 만 왔을 때만 기존 이미지를 지운다.
            remove_image = request.data.get("remove_image")
            if (
                remove_image in ("true", "1", True)
                and "image" not in request.data
                and review.image
            ):
                review.image.delete(save=False)
                review.image = None
                review.save(update_fields=["image"])

            return Response(
                MyReviewSerializer(review).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    review.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )
