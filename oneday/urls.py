from django.urls import path
from . import views


urlpatterns = [

    # ==========================================
    # 내 수강 프로그램 목록
    # ==========================================
    path(
        "my-programs/",
        views.myprogram_list,
        name="myprogram-list"
    ),


    # ==========================================
    # 양도 게시글 목록 조회 / 게시글 작성
    # GET, POST
    # ==========================================
    path(
        "posts/",
        views.onedaypost_list,
        name="onedaypost-list"
    ),


    # ==========================================
    # 양도 게시글 상세 조회 / 수정 / 삭제
    # GET, PUT, PATCH, DELETE
    # ==========================================
    path(
        "posts/<int:post_id>/",
        views.onedaypost_detail,
        name="onedaypost-detail"
    ),


    # ==========================================
    # 원데이 프로그램 신청 목록
    # ==========================================
    path(
        "applications/",
        views.onedayapplication_list,
        name="onedayapplication-list"
    ),

        # ==========================================
    # 새로운 프로그램 등록
    # ==========================================
    path(
        "my-programs/create/",
        views.create_my_program,
        name="create-my-program"
    ),

]