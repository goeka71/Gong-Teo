from django.shortcuts import get_object_or_404

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
    MyReviewSerializer,
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


@api_view(["GET"])
def coin_history_list(request):
    data = CoinHistory.objects.all()
    serializer = CoinHistorySerializer(data, many=True)
    return Response(serializer.data)


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
    POST : 로그인한 사용자의 새 리뷰 작성
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
        review = serializer.save(
            user=request.user
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
            serializer.save()

            return Response(
                serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    review.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )
