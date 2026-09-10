from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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
    FacilityDetailWriteSerializer,
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


@api_view(["PATCH"])
@permission_classes([AllowAny])  # 지금은 누구나 수정 가능. 로그인 필수로 바꾸려면 이 줄만 IsAuthenticated 로.
def facility_detail_upsert(request, facility_id):
    """시설 세부정보(FacilityDetail) 추가·수정.

    시설당 FacilityDetail 은 1개로 강제한다.
    - 이미 있으면 update
    - 없으면 create
    """
    facility = get_object_or_404(Facility, pk=facility_id)

    # 시설당 1개 규칙: 가장 먼저 만들어진 것 하나만 대상으로 삼는다.
    detail = FacilityDetail.objects.filter(facility=facility).order_by("id").first()

    serializer = FacilityDetailWriteSerializer(
        instance=detail, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save(facility=facility)

    created = detail is None
    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


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


@api_view(["GET", "POST"])
def subfacility_detail_list(request):
    # POST: 세부시설 기여 정보 작성. 로그인 불필요 - 작성자 필드 없음.
    # facility 는 body 로 받지 않고 subfacility 로부터 서버에서 채운다.
    if request.method == "POST":
        serializer = SubFacilityDetailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subfacility = serializer.validated_data["subfacility"]
        serializer.save(facility=subfacility.facility)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # GET: ?subfacility=<id> 로 특정 세부시설의 기여 정보만 필터링.
    # 쿼리 파라미터가 없으면 기존과 동일하게 전체 반환.
    data = SubFacilityDetail.objects.all()
    subfacility_id = request.query_params.get("subfacility")
    if subfacility_id:
        data = data.filter(subfacility_id=subfacility_id)
    serializer = SubFacilityDetailSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def subfacility_detail_agree(request, pk):
    # 중복 방지 로직 없이 단순히 +1 만 한다 (의도된 설계).
    detail = get_object_or_404(SubFacilityDetail, pk=pk)
    detail.agree_count = F("agree_count") + 1
    detail.save(update_fields=["agree_count"])
    detail.refresh_from_db()
    serializer = SubFacilityDetailSerializer(detail)
    return Response(serializer.data)


@api_view(["POST"])
def subfacility_detail_disagree(request, pk):
    # 중복 방지 로직 없이 단순히 +1 만 한다 (의도된 설계).
    detail = get_object_or_404(SubFacilityDetail, pk=pk)
    detail.disagree_count = F("disagree_count") + 1
    detail.save(update_fields=["disagree_count"])
    detail.refresh_from_db()
    serializer = SubFacilityDetailSerializer(detail)
    return Response(serializer.data)