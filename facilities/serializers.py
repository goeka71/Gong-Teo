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
    """시설 상세정보(FacilityDetail) 생성·수정 전용.

    facility 는 URL 로 받고, created_at 은 자동 생성이므로 입력 필드에서 제외한다.
    나머지 검증(website URL 형식, boolean, max_length 등)은 모델 정의대로
    DRF 가 자동 처리한다.
    """

    class Meta:
        model = FacilityDetail
        fields = ["op_hour", "in_out", "phone", "website",
                  "fee", "shower", "parking"]

    def validate_fee(self, value):
        # 모델상 fee 는 CharField 라 숫자 검증이 자동으로 안 됨 → 직접 검사.
        # 값이 비어 있으면 통과. 쉼표·공백·'원' 을 떼고 숫자만 남는지 확인한다.
        if not value:
            return value
        n = value.replace(",", "").replace(" ", "").removesuffix("원")
        if not n.isdigit():
            raise serializers.ValidationError(
                "이용료는 숫자로 입력해 주세요. 예: 3000"
            )
        return value


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