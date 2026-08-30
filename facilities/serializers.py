from rest_framework import serializers

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


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = "__all__"


class SubFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubFacility
        fields = "__all__"


class FacilityDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityDetail
        fields = "__all__"


class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = "__all__"


class FacilitySportSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilitySport
        fields = "__all__"


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = "__all__"


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = "__all__"


class SubFacilityDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubFacilityDetail
        fields = "__all__"