from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views


urlpatterns = [
    path(
        "",
        views.user_list,
        name="user-list"
    ),

    path(
        "signup/",
        views.signup,
        name="signup"
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh"
    ),

    path(
        "coin-history/",
        views.coin_history_list,
        name="coin-history-list"
    ),

    path(
        "me/",
        views.my_info,
        name="my-info"
    ),

    path(
        "my-programs/",
        views.my_programs,
        name="my-programs"
    ),

    path(
        "my-reviews/",
        views.my_reviews,
        name="my-reviews"
    ),

    path(
        "my-reviews/<int:review_id>/",
        views.my_review_detail,
        name="my-review-detail"
    ),
]
