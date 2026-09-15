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


class FacilityReviewSerializer(serializers.ModelSerializer):
    """시설/세부시설 기준 리뷰 공개 목록·미리보기용 (읽기 전용).

    "내 리뷰"(users.MyReviewSerializer)와 달리 작성자 본인이 아닌
    다른 사용자도 보는 목록이라 작성자 이름을 노출하고, 수정 검증
    로직은 없다.
    """

    user_name = serializers.CharField(
        source="user.name",
        read_only=True
    )

    subfacility_name = serializers.CharField(
        source="subfacility.subfacility_name",
        read_only=True,
        allow_null=True
    )

    program_name = serializers.CharField(
        source="program.program_name",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Review
        fields = [
            "id",
            "user_name",
            "subfacility",
            "subfacility_name",
            "program",
            "program_name",
            "rating",
            "content",
            "image",
            "created_at",
        ]


class FavoriteSerializer(serializers.ModelSerializer):

    # 마이페이지 "찜한 시설" 목록 카드 표시용 시설 정보
    facility_name = serializers.CharField(
        source="facility.facility_name",
        read_only=True
    )

    facility_addr = serializers.CharField(
        source="facility.addr",
        read_only=True
    )

    station = serializers.CharField(
        source="facility.station",
        read_only=True,
        allow_blank=True
    )

    station_wt = serializers.IntegerField(
        source="facility.station_wt",
        read_only=True,
        allow_null=True
    )

    bus = serializers.CharField(
        source="facility.bus",
        read_only=True,
        allow_blank=True
    )

    bus_wt = serializers.IntegerField(
        source="facility.bus_wt",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Favorite

        fields = [
            "id",
            "user",
            "facility",

            "facility_name",
            "facility_addr",

            "station",
            "station_wt",
            "bus",
            "bus_wt",
        ]


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