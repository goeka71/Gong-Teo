from django.urls import path
from . import views


urlpatterns = [
    path("", views.user_list, name="user-list"),
    path("signup/", views.signup, name="signup"),
    path("coin-history/", views.coin_history_list, name="coin-history-list"),
]