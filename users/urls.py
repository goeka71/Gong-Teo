from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views


urlpatterns = [
    # 사용자 목록
    path("", views.user_list, name="user-list"),

    # 회원가입
    path("signup/", views.signup, name="signup"),

    # 로그인
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    # JWT Access Token 재발급
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    # 코인 내역
    path(
        "coin-history/",
        views.coin_history_list,
        name="coin-history-list",
    ),

    # 내 정보 조회 / 수정
    path(
        "me/",
        views.my_info,
        name="my-info",
    ),

    # 나의 수강 프로그램 조회 / 등록
    path(
        "my-programs/",
        views.my_programs,
        name="my-programs",
    ),
]