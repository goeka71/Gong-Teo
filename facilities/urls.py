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

    # 시설 하나의 상세정보(FacilityDetail) 조회 / 생성·수정
    path(
        "<int:facility_id>/detail/",
        views.facility_detail_update,
        name="facility-detail-update"
    ),

    # 시설 하나의 상세 정보 (기본정보 + FacilityDetail + 세부시설 + 종목)
    path(
        "<int:facility_id>/",
        views.facility_detail,
        name="facility-detail"
    ),
]