from django.urls import path

from . import views


urlpatterns = [

    # =====================================================
    # 시설 전체 목록 조회 + 검색/필터
    # 예:
    # /api/facilities/
    # /api/facilities/?sport=수영
    # =====================================================
    path(
        "",
        views.facility_list,
        name="facility-list"
    ),


    # =====================================================
    # 세부시설 전체 목록 조회
    # 예:
    # /api/facilities/subfacilities/
    # =====================================================
    path(
        "subfacilities/",
        views.subfacility_list,
        name="subfacility-list"
    ),


    # =====================================================
    # 특정 세부시설 하나 상세 조회
    # 예:
    # /api/facilities/subfacilities/5/
    # =====================================================
    path(
        "subfacilities/<int:subfacility_id>/",
        views.subfacility_detail,
        name="subfacility-detail"
    ),


    # =====================================================
    # FacilityDetail 전체 목록
    # =====================================================
    path(
        "details/",
        views.facility_detail_list,
        name="facility-detail-list"
    ),


    # =====================================================
    # 종목 전체 목록
    # =====================================================
    path(
        "sports/",
        views.sport_list,
        name="sport-list"
    ),


    # =====================================================
    # 시설-종목 연결 전체 목록
    # =====================================================
    path(
        "facility-sports/",
        views.facility_sport_list,
        name="facility-sport-list"
    ),


    # =====================================================
    # 프로그램 전체 목록
    # =====================================================
    path(
        "programs/",
        views.program_list,
        name="program-list"
    ),


    # =====================================================
    # 리뷰 전체 목록
    # =====================================================
    path(
        "reviews/",
        views.review_list,
        name="review-list"
    ),


    # =====================================================
    # 찜 전체 목록
    # =====================================================
    path(
        "favorites/",
        views.favorite_list,
        name="favorite-list"
    ),


    # =====================================================
    # SubFacilityDetail 전체 목록
    # =====================================================
    path(
        "subfacility-details/",
        views.subfacility_detail_list,
        name="subfacility-detail-list"
    ),


    # =====================================================
    # 특정 상위 시설 하나 상세 조회
    #
    # 반드시 아래쪽에 두는 게 보기 편함
    # 예:
    # /api/facilities/3/
    # =====================================================
    path(
        "<int:facility_id>/",
        views.facility_detail,
        name="facility-detail"
    ),
]