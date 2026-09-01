from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)
from facilities.models import Facility, Program
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
# ==========================================
# 새로운 프로그램 등록
# ==========================================
@api_view(["POST"])
def create_my_program(request):

    # 프론트에서 받은 데이터
    program_name = request.data.get("program_name")
    facility_name = request.data.get("facility_name")
    program_day = request.data.get("program_day")
    program_time = request.data.get("program_time")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")


    # 필수값 확인
    if not all([
        program_name,
        facility_name,
        program_day,
        program_time,
        start_date,
        end_date,
    ]):

        return Response(
            {
                "message": "모든 정보를 입력해주세요."
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    # ==========================================
    # 시설 찾기
    # ==========================================

    facility = Facility.objects.filter(
        facility_name=facility_name
    ).first()


    # 시설이 DB에 없으면 생성
    if not facility:

        return Response(
            {
                "message": "해당 시설이 DB에 없습니다."
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    # ==========================================
    # Program 생성
    # ==========================================

    program = Program.objects.create(

        facility=facility,

        program_name=program_name,

        program_day=program_day,

        program_time=program_time,

    )


    # ==========================================
    # MyProgram 생성
    # ==========================================

    # ⚠️ 현재 로그인 기능이 연결되지 않았으므로
    # 임시 사용자 처리 필요

    user = request.user


    if not user.is_authenticated:

        return Response(
            {
                "message": "로그인이 필요합니다."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


    my_program = MyProgram.objects.create(

        user=user,

        program=program,

        start_date=start_date,

        end_date=end_date,

        program_day=program_day,

        program_time=program_time,

        status="approved",

    )


    return Response(
        {
            "message": "프로그램이 성공적으로 등록되었습니다.",

            "id": my_program.id,

            "program_name": program.program_name,

            "facility_name": facility.facility_name,

            "program_day": my_program.program_day,

            "program_time": my_program.program_time,

        },

        status=status.HTTP_201_CREATED
    )