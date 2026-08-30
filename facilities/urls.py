from django.urls import path

from . import views


urlpatterns = [
    path("", views.facility_list, name="facility-list"),

    path(
        "subfacilities/",
        views.subfacility_list,
        name="subfacility-list"
    ),

    path(
        "details/",
        views.facility_detail_list,
        name="facility-detail-list"
    ),

    path(
        "sports/",
        views.sport_list,
        name="sport-list"
    ),

    path(
        "facility-sports/",
        views.facility_sport_list,
        name="facility-sport-list"
    ),

    path(
        "programs/",
        views.program_list,
        name="program-list"
    ),

    path(
        "reviews/",
        views.review_list,
        name="review-list"
    ),

    path(
        "favorites/",
        views.favorite_list,
        name="favorite-list"
    ),

    path(
        "subfacility-details/",
        views.subfacility_detail_list,
        name="subfacility-detail-list"
    ),
]