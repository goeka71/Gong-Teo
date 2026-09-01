from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

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
# 내 수강 프로그램 목록
# ==========================================
@api_view(["GET"])
def myprogram_list(request):

    # 현재는 승인된 프로그램만 조회
    data = MyProgram.objects.filter(status="approved")

    serializer = MyProgramSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# ==========================================
# 양도 게시글 목록 / 작성
# ==========================================
@api_view(["GET", "POST"])
def onedaypost_list(request):

    # ------------------------------
    # 게시글 목록 조회
    # ------------------------------
    if request.method == "GET":

        data = OnedayPost.objects.all().order_by("-created_at")

        serializer = OnedayPostSerializer(
            data,
            many=True
        )

        return Response(serializer.data)

    # ------------------------------
    # 게시글 작성
    # ------------------------------
    elif request.method == "POST":

        serializer = OnedayPostSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# 양도 게시글 상세 / 수정 / 삭제
# ==========================================
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def onedaypost_detail(request, post_id):

    post = get_object_or_404(
        OnedayPost,
        id=post_id
    )

    # ------------------------------
    # 게시글 상세 조회
    # ------------------------------
    if request.method == "GET":

        serializer = OnedayPostSerializer(post)

        return Response(serializer.data)

    # ------------------------------
    # 게시글 전체 수정
    # ------------------------------
    elif request.method == "PUT":

        serializer = OnedayPostSerializer(
            post,
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # ------------------------------
    # 게시글 일부 수정
    # ------------------------------
    elif request.method == "PATCH":

        serializer = OnedayPostSerializer(
            post,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # ------------------------------
    # 게시글 삭제
    # ------------------------------
    elif request.method == "DELETE":

        post.delete()

        return Response(
            {
                "message": "게시글이 삭제되었습니다."
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# 원데이 프로그램 신청 목록
# ==========================================
@api_view(["GET"])
def onedayapplication_list(request):

    data = OnedayApplication.objects.all()

    serializer = OnedayApplicationSerializer(
        data,
        many=True
    )

    return Response(serializer.data)