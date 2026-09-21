from django.db.models import Avg, Count, F, Min
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

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
    FacilityReviewSerializer,
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
# Program 이 9만 건 규모라 전체 조회는 OOM 위험이 있어서,
# facility 또는 subfacility 중 하나는 반드시 있어야 한다 (없으면 400).
#
# q 를 주면 프로그램명에 q 가 포함된 것만 DB 에서 걸러 준다
# (program_name__icontains). 시설당 프로그램이 수천 건이라 결과는
# ProgramPagination 으로 페이지를 나눠 주고(기본 50건), 나머지는 검색으로 찾게 한다.
#
# 같은 항목은 하나로 묶어서 준다.
# 초기 데이터(program.csv)에는 시설·세부시설·이름·요일·시간이 모두 같은 행이
# 수십~수백 개씩 들어 있어서, 그대로 내려주면 화면에 똑같은 항목이 줄줄이
# 나온다. 그래서 PROGRAM_GROUP_FIELDS 가 모두 같은 행은 가장 작은 id 의
# 행 하나만 내려준다. (수용인원 program_cap 은 묶는 기준이 아니다.)
# DB 의 행은 지우지 않고 조회할 때만 묶는다. 이미 다른 행을 가리키는
# MyProgram / Review 는 그대로 유효하다.
#
# 특정 시설:
# /api/facilities/programs/?facility=3
#
# 특정 시설 + 세부시설:
# /api/facilities/programs/?facility=3&subfacility=7
#
# 검색 (프로그램명에 "수영" 포함):
# /api/facilities/programs/?facility=3&q=수영
# =========================================================

class ProgramPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


# 이 필드가 모두 같으면 화면에서 구분할 수 없는 같은 프로그램으로 본다.
PROGRAM_GROUP_FIELDS = (
    "facility_id",
    "subfacility_id",
    "program_name",
    "program_day",
    "program_time",
)


@api_view(["GET"])
def program_list(request):
    facility_id = request.GET.get("facility")
    subfacility_id = request.GET.get("subfacility")
    q = request.GET.get("q", "").strip()

    if not facility_id and not subfacility_id:
        return Response(
            {
                "detail": "facility 또는 subfacility 파라미터가 필요합니다."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = Program.objects.all()

    if facility_id:
        data = data.filter(
            facility_id=facility_id
        )

    if subfacility_id:
        data = data.filter(
            subfacility_id=subfacility_id
        )

    if q:
        data = data.filter(
            program_name__icontains=q
        )

    # 같은 항목(PROGRAM_GROUP_FIELDS 가 모두 같은 행)은 대표 id 하나만 남긴다.
    # 위에서 건 필터(시설/세부시설/q)를 적용한 뒤에 묶으므로 검색 결과 안에서만 묶인다.
    representative_ids = (
        data.order_by()
        .values(*PROGRAM_GROUP_FIELDS)
        .annotate(representative_id=Min("id"))
        .values("representative_id")
    )

    data = Program.objects.filter(
        id__in=representative_ids
    ).order_by(
        "program_name",
        "id"
    )

    paginator = ProgramPagination()

    page = paginator.paginate_queryset(
        data,
        request
    )

    serializer = ProgramSerializer(
        page,
        many=True
    )

    return paginator.get_paginated_response(
        serializer.data
    )
# =========================================================
# 시설 리뷰 미리보기
# 상위 3개 + 평균 별점 + 전체 개수.
# 예: /api/facilities/12/reviews/preview/
# =========================================================
@api_view(["GET"])
def facility_review_preview(request, facility_id):
    facility = get_object_or_404(Facility, pk=facility_id)

    reviews = Review.objects.filter(facility=facility)

    stats = reviews.aggregate(
        average_rating=Avg("rating"),
        review_count=Count("id"),
    )

    top_reviews = reviews.select_related(
        "user", "subfacility", "program"
    ).order_by("-created_at")[:3]

    serializer = FacilityReviewSerializer(top_reviews, many=True)

    average_rating = stats["average_rating"]

    return Response({
        "average_rating":
            round(average_rating, 1) if average_rating is not None else None,
        "review_count": stats["review_count"],
        "reviews": serializer.data,
    })


# =========================================================
# 시설 전체 리뷰 목록
# 항상 최신순(-created_at). 쿼리 파라미터로 필터링 가능:
#
# ?category=program  -> 프로그램 리뷰만 (program 필드가 채워진 것)
# ?category=facility -> 시설 리뷰만 (program 이 비어있는 것)
# ?subfacility=<id>  -> 해당 세부시설 리뷰만
# ?has_photo=true    -> 사진이 첨부된 리뷰만
#
# 예: /api/facilities/12/reviews/?category=program&has_photo=true
# =========================================================
@api_view(["GET"])
def facility_review_list(request, facility_id):
    facility = get_object_or_404(Facility, pk=facility_id)

    reviews = Review.objects.filter(
        facility=facility
    ).select_related("user", "subfacility", "program")

    category = request.GET.get("category")

    if category == "program":
        reviews = reviews.filter(program__isnull=False)
    elif category == "facility":
        reviews = reviews.filter(program__isnull=True)

    subfacility_id = request.GET.get("subfacility")

    if subfacility_id:
        reviews = reviews.filter(subfacility_id=subfacility_id)

    has_photo = request.GET.get("has_photo")

    if has_photo in ("true", "1"):
        reviews = reviews.filter(
            image__isnull=False
        ).exclude(image="")

    reviews = reviews.order_by("-created_at")

    serializer = FacilityReviewSerializer(reviews, many=True)

    return Response(serializer.data)


# =========================================================
# 찜 목록 조회 / 찜 토글(추가·삭제)
# =========================================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def favorite_list(request):

    # ======================================
    # GET
    # 내가 찜한 시설 목록
    # ======================================

    if request.method == "GET":

        data = Favorite.objects.filter(
            user=request.user
        ).select_related("facility")

        serializer = FavoriteSerializer(
            data,
            many=True
        )

        return Response(serializer.data)

    # ======================================
    # POST
    # 찜 토글: 이미 찜한 시설이면 삭제, 아니면 추가
    # ======================================

    facility_id = request.data.get("facility")

    if not facility_id:
        return Response(
            {"detail": "facility는 필수입니다."},
            status=status.HTTP_400_BAD_REQUEST
        )

    facility = get_object_or_404(Facility, id=facility_id)

    favorite = Favorite.objects.filter(
        user=request.user,
        facility=facility,
    ).first()

    if favorite:
        favorite.delete()
        return Response(
            {"facility": facility.id, "wished": False}
        )

    Favorite.objects.create(
        user=request.user,
        facility=facility,
    )

    return Response(
        {"facility": facility.id, "wished": True},
        status=status.HTTP_201_CREATED
    )


# =========================================================
# 세부시설 상세정보 목록
# =========================================================
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