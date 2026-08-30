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
)


@api_view(["GET"])
def facility_list(request):
    data = Facility.objects.all()
    serializer = FacilitySerializer(data, many=True)
    return Response(serializer.data)


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