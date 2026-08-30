from django.urls import path

from . import views


urlpatterns = [
    path("my-programs/", views.myprogram_list, name="myprogram-list"),
    path("posts/", views.onedaypost_list, name="onedaypost-list"),
    path("applications/", views.onedayapplication_list, name="onedayapplication-list"),
]