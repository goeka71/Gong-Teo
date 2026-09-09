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


class FacilityDetailWriteSerializer(serializers.ModelSerializer):
    """시설 세부정보(FacilityDetail) upsert 전용.

    facility 는 URL 로 받아 서버에서 채우므로 클라이언트가 보내지 않는다.
    사용자가 편집 가능한 필드만 노출한다.
    """

    class Meta:
        model = FacilityDetail
        fields = (
            "id",
            "facility",
            "op_hour",
            "in_out",
            "phone",
            "website",
            "fee",
            "shower",
            "parking",
            "created_at",
        )
        read_only_fields = ("id", "facility", "created_at")


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
        # facility 는 subfacility 로부터 서버에서 채워주고(생성 시 클라이언트가 안 보내도 됨),
        # agree_count/disagree_count 는 전용 동의/비동의 엔드포인트로만 바뀐다.
        read_only_fields = ("facility", "agree_count", "disagree_count", "created_at")


class FacilityDetailPageSerializer(serializers.ModelSerializer):
    """시설 상세 페이지용. 시설 기본정보에 자식 테이블들을 묶어서 반환한다."""

    # 모델에 걸린 related_name 을 그대로 필드로 선언하면
    # DRF 가 "이 시설에 연결된 자식 행들"을 배열로 채워준다.
    sub_facilities = SubFacilitySerializer(many=True, read_only=True)
    details = FacilityDetailSerializer(many=True, read_only=True)

    # FacilitySport 를 거쳐 Sport 로 가야 하므로 직접 계산한다.
    sports = serializers.SerializerMethodField()

    class Meta:
        model = Facility
        fields = "__all__"

    def get_sports(self, obj):
        sports = Sport.objects.filter(facility_sports__facility=obj).distinct()
        return SportSerializer(sports, many=True).data