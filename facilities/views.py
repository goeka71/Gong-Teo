from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q

from .models import (
    Facility,
    SubFacility,
    FacilityDetail,
    Sport,
    FacilitySport,
    Program,
    Review,
    Favorite,
    SubFacilityDetail,
)

from .serializers import (
    FacilitySerializer,
    SubFacilitySerializer,
    FacilityDetailSerializer,
    SportSerializer,
    FacilitySportSerializer,
    ProgramSerializer,
    ReviewSerializer,
    FavoriteSerializer,
    SubFacilityDetailSerializer,
)


# =========================================================
# 1. 시설 전체 목록 조회 + 검색 + 필터링
# =========================================================

@api_view(["GET"])
def facility_list(request):

    # 모든 시설을 먼저 가져옴
    data = Facility.objects.all()

    # -----------------------------------------------------
    # 검색
    # 예: ?q=수영
    #
    # 시설명 / 주소 / 종목명 중
    # 검색어가 포함된 시설을 찾음
    # -----------------------------------------------------
    q = request.GET.get("q")

    if q:
        data = data.filter(
            Q(facility_name__icontains=q)
            | Q(addr__icontains=q)
            | Q(facility_sports__sport__sport_name__icontains=q)
        )

    # -----------------------------------------------------
    # 지역 필터
    # 예: ?region=서대문구
    # -----------------------------------------------------
    region = request.GET.get("region")

    if region:
        data = data.filter(
            addr__icontains=region
        )

    # -----------------------------------------------------
    # 종목 필터
    # 예: ?sport=수영
    # -----------------------------------------------------
    sport = request.GET.get("sport")

    if sport:
        data = data.filter(
            facility_sports__sport__sport_name__icontains=sport
        )

    # -----------------------------------------------------
    # 실내외 필터
    # 예: ?in_out=실내
    # -----------------------------------------------------
    in_out = request.GET.get("in_out")

    if in_out:
        data = data.filter(
            details__in_out__icontains=in_out
        )

    # 조인 때문에 같은 시설이 여러 번 나오는 것을 방지
    data = data.distinct()

    # 시설 목록을 JSON으로 변환
    serializer = FacilitySerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 2. 특정 시설 하나 상세 조회
# =========================================================
#
# 예:
# /api/facilities/3/
#
# → id가 3인 Facility 하나만 반환
# =========================================================

@api_view(["GET"])
def facility_detail(request, facility_id):

    try:
        # URL로 받은 facility_id와 같은 시설 찾기
        facility = Facility.objects.get(
            id=facility_id
        )

    except Facility.DoesNotExist:

        # 해당 시설이 없는 경우
        return Response(
            {
                "message": "해당 시설을 찾을 수 없습니다."
            },
            status=404
        )

    # 시설 하나를 JSON으로 변환
    serializer = FacilitySerializer(facility)

    return Response(serializer.data)


# =========================================================
# 3. 세부시설 전체 목록 조회
# =========================================================

@api_view(["GET"])
def subfacility_list(request):

    data = SubFacility.objects.all()

    serializer = SubFacilitySerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 4. 특정 세부시설 하나 상세 조회
# =========================================================
#
# 예:
# /api/facilities/subfacilities/5/
#
# → id가 5인 SubFacility 하나만 반환
# =========================================================

@api_view(["GET"])
def subfacility_detail(request, subfacility_id):

    try:
        # URL로 받은 subfacility_id와 같은 세부시설 찾기
        subfacility = SubFacility.objects.get(
            id=subfacility_id
        )

    except SubFacility.DoesNotExist:

        # 해당 세부시설이 없는 경우
        return Response(
            {
                "message": "해당 세부시설을 찾을 수 없습니다."
            },
            status=404
        )

    # 세부시설 하나를 JSON으로 변환
    # SubFacilityDetail도 같이 반환됨
    serializer = SubFacilitySerializer(subfacility)

    return Response(serializer.data)


# =========================================================
# 5. FacilityDetail 전체 목록 조회
# =========================================================

@api_view(["GET"])
def facility_detail_list(request):

    data = FacilityDetail.objects.all()

    serializer = FacilityDetailSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 6. 종목 전체 목록 조회
# =========================================================

@api_view(["GET"])
def sport_list(request):

    data = Sport.objects.all()

    serializer = SportSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 7. 시설-종목 연결 전체 목록 조회
# =========================================================

@api_view(["GET"])
def facility_sport_list(request):

    data = FacilitySport.objects.all()

    serializer = FacilitySportSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 8. 프로그램 전체 목록 조회
# =========================================================

@api_view(["GET"])
def program_list(request):

    data = Program.objects.all()

    serializer = ProgramSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 9. 리뷰 전체 목록 조회
# =========================================================

@api_view(["GET"])
def review_list(request):

    data = Review.objects.all()

    serializer = ReviewSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 10. 찜 전체 목록 조회
# =========================================================

@api_view(["GET"])
def favorite_list(request):

    data = Favorite.objects.all()

    serializer = FavoriteSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 11. 세부시설 상세정보 전체 목록 조회
# =========================================================

@api_view(["GET"])
def subfacility_detail_list(request):

    data = SubFacilityDetail.objects.all()

    serializer = SubFacilityDetailSerializer(
        data,
        many=True
    )

    return Response(serializer.data)