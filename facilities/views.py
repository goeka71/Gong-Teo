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
    FacilityDetailWriteSerializer,
    SportSerializer,
    FacilitySportSerializer,
    ProgramSerializer,
    ReviewSerializer,
    FavoriteSerializer,
    SubFacilityDetailSerializer,
    FacilityDetailPageSerializer,
)


@api_view(["GET"])
def facility_list(request):
    data = Facility.objects.all()
    serializer = FacilitySerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def facility_detail(request, facility_id):
    # 해당 id 시설이 없으면 자동으로 404 응답
    facility = get_object_or_404(Facility, pk=facility_id)
    serializer = FacilityDetailPageSerializer(facility)
    return Response(serializer.data)


@api_view(["GET", "PUT", "PATCH"])
def facility_detail_update(request, facility_id):
    """시설 하나의 상세정보(FacilityDetail)를 조회 / 생성·수정한다.

    - GET   : 현재 저장된 상세정보 1건 반환 (없으면 빈 객체 {})
    - PUT/PATCH : 상세정보가 없으면 새로 만들고(201), 있으면 수정(200).
      FacilityDetail 은 시설당 여러 개일 수 있으나, 이 화면에서는
      '첫 번째 한 개'를 그 시설의 상세정보로 다룬다.

    로그인 기능이 아직 없어 인증 없이 누구나 수정 가능하다
    (DRF 기본 권한이 AllowAny). 나중에 작성자 필드를 붙일 자리.
    """
    facility = get_object_or_404(Facility, pk=facility_id)
    instance = FacilityDetail.objects.filter(facility=facility).first()

    if request.method == "GET":
        if instance is None:
            return Response({})
        return Response(FacilityDetailSerializer(instance).data)

    partial = request.method == "PATCH"
    serializer = FacilityDetailWriteSerializer(
        instance, data=request.data, partial=partial
    )
    serializer.is_valid(raise_exception=True)  # 검증 실패 시 자동 400 + 에러 JSON
    serializer.save(facility=facility)  # instance 가 None 이면 생성, 아니면 수정

    return Response(serializer.data, status=200 if instance else 201)


@api_view(["GET"])
def subfacility_list(request):
    data = SubFacility.objects.all()
    serializer = SubFacilitySerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def facility_detail_list(request):
    data = FacilityDetail.objects.all()
    serializer = FacilityDetailSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def sport_list(request):
    data = Sport.objects.all()
    serializer = SportSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def facility_sport_list(request):
    data = FacilitySport.objects.all()
    serializer = FacilitySportSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def program_list(request):
    data = Program.objects.all()
    serializer = ProgramSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def review_list(request):
    data = Review.objects.all()
    serializer = ReviewSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def favorite_list(request):
    data = Favorite.objects.all()
    serializer = FavoriteSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def subfacility_detail_list(request):
    data = SubFacilityDetail.objects.all()
    serializer = SubFacilityDetailSerializer(data, many=True)
    return Response(serializer.data)