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


# =========================================================
# 1. 시설 상세정보
# =========================================================
class FacilityDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityDetail
        fields = "__all__"


# =========================================================
# 2. 세부시설 상세정보
# 예: 수영장 수심, 레인, 이용료 등
# =========================================================
class SubFacilityDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubFacilityDetail
        fields = "__all__"


# =========================================================
# 3. 세부시설
# 예: 수영장, 헬스장, 체육관 등
# =========================================================
class SubFacilitySerializer(serializers.ModelSerializer):

    # 이 세부시설에 연결된 상세정보도 같이 반환
    # models.py에서 related_name="details"로 연결되어 있음
    details = SubFacilityDetailSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = SubFacility
        fields = [
            "id",
            "subfacility_name",
            "facility",
            "details",
        ]


# =========================================================
# 4. 상위 시설
# =========================================================
class FacilitySerializer(serializers.ModelSerializer):

    # 시설과 연결된 종목 목록
    sports = serializers.SerializerMethodField()

    # 시설 상세정보 연결
    details = FacilityDetailSerializer(
        many=True,
        read_only=True
    )

    # 세부시설 목록 연결
    sub_facilities = SubFacilitySerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Facility
        fields = [
            "id",
            "facility_name",
            "image",
            "addr",
            "latit",
            "longit",
            "station",
            "bus",
            "station_wt",
            "bus_wt",
            "sports",
            "details",
            "sub_facilities",
        ]

    # FacilitySport를 통해 연결된 종목 이름만 리스트로 반환
    def get_sports(self, obj):
        return [
            facility_sport.sport.sport_name
            for facility_sport in obj.facility_sports.all()
        ]


# =========================================================
# 5. 종목
# =========================================================
class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = "__all__"


# =========================================================
# 6. 시설-종목 연결
# =========================================================
class FacilitySportSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilitySport
        fields = "__all__"


# =========================================================
# 7. 프로그램
# =========================================================
class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = "__all__"


# =========================================================
# 8. 리뷰
# =========================================================
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"


# =========================================================
# 9. 찜
# =========================================================
class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = "__all__"