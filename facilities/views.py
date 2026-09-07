from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view
from rest_framework.response import Response

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
    FacilityDetailPageSerializer,
)


# =========================================================
# 시설 목록
# 지역 필터 가능
# 예: /api/facilities/?region=서대문구
# =========================================================
@api_view(["GET"])
def facility_list(request):
    data = Facility.objects.all()

    region = request.GET.get("region")

    if region:
        data = data.filter(addr__icontains=region)

    serializer = FacilitySerializer(data, many=True)

    return Response(serializer.data)


# =========================================================
# 시설 상세
# =========================================================
@api_view(["GET"])
def facility_detail(request, facility_id):
    facility = get_object_or_404(
        Facility,
        pk=facility_id
    )

    serializer = FacilityDetailPageSerializer(facility)

    return Response(serializer.data)


# =========================================================
# 세부시설 목록
#
# 전체:
# /api/facilities/subfacilities/
#
# 특정 시설:
# /api/facilities/subfacilities/?facility=3
# =========================================================
@api_view(["GET"])
def subfacility_list(request):
    data = SubFacility.objects.all()

    facility_id = request.GET.get("facility")

    if facility_id:
        data = data.filter(
            facility_id=facility_id
        )

    serializer = SubFacilitySerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 시설 상세정보 목록
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
# 종목 목록
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
# 시설-종목 관계 목록
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
# 프로그램 목록
#
# 전체:
# /api/facilities/programs/
#
# 특정 시설:
# /api/facilities/programs/?facility=3
#
# 특정 시설 + 세부시설:
# /api/facilities/programs/?facility=3&subfacility=7
# =========================================================
@api_view(["GET"])
def program_list(request):
    data = Program.objects.all()

    facility_id = request.GET.get("facility")
    subfacility_id = request.GET.get("subfacility")

    if facility_id:
        data = data.filter(
            facility_id=facility_id
        )

    if subfacility_id:
        data = data.filter(
            subfacility_id=subfacility_id
        )

    serializer = ProgramSerializer(
        data,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# 리뷰 목록
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
# 찜 목록
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
# 세부시설 상세정보 목록
# =========================================================
@api_view(["GET"])
def subfacility_detail_list(request):
    data = SubFacilityDetail.objects.all()

    serializer = SubFacilityDetailSerializer(
        data,
        many=True
    )

    return Response(serializer.data)