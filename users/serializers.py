from rest_framework import serializers

from .models import User, CoinHistory
from oneday.models import MyProgram
from facilities.models import Program, Review


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "birth",
            "phone",
            "coin",
        ]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "email",
            "name",
            "birth",
            "phone",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
            name=validated_data["name"],
            birth=validated_data.get("birth"),
            phone=validated_data.get("phone", ""),
        )
        return user


class CoinHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinHistory
        fields = "__all__"


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "name",
            "birth",
            "phone",
        ]


class MyProgramSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(
        source="program.program_name",
        read_only=True
    )

    facility_id = serializers.IntegerField(
        source="program.facility.id",
        read_only=True
    )

    facility_name = serializers.CharField(
        source="program.facility.facility_name",
        read_only=True
    )

    subfacility_name = serializers.CharField(
        source="subfacility.subfacility_name",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = MyProgram
        fields = [
            "id",
            "program",
            "program_name",
            "facility_id",
            "facility_name",
            "subfacility",
            "subfacility_name",
            "start_date",
            "end_date",
            "program_day",
            "program_time",
            "proof_image",
            "status",
            "reject_reason",
        ]

        read_only_fields = [
            "id",
            "status",
            "reject_reason",
        ]

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                "end_date":
                    "수강 종료일은 시작일보다 빠를 수 없습니다."
            })

        program = data.get("program")
        subfacility = data.get("subfacility")

        if program and subfacility:
            if program.facility_id != subfacility.facility_id:
                raise serializers.ValidationError({
                    "subfacility":
                        "선택한 프로그램과 세부시설의 시설이 일치하지 않습니다."
                })

        return data


class MyProgramCreateSerializer(serializers.ModelSerializer):
    facility = serializers.IntegerField(
        write_only=True,
        required=False
    )

    new_program_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )

    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        required=False
    )

    # 새 수강 프로그램 등록에서는 수강증 필수
    proof_image = serializers.ImageField(
        required=True
    )

    class Meta:
        model = MyProgram
        fields = [
            "program",
            "facility",
            "subfacility",
            "new_program_name",
            "start_date",
            "end_date",
            "program_day",
            "program_time",
            "proof_image",
        ]

    def validate(self, data):
        program = data.get("program")
        facility_id = data.get("facility")
        subfacility = data.get("subfacility")
        new_program_name = data.get(
            "new_program_name",
            ""
        ).strip()

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                "end_date":
                    "수강 종료일은 시작일보다 빠를 수 없습니다."
            })

        if not program and not new_program_name:
            raise serializers.ValidationError({
                "program":
                    "프로그램을 선택하거나 프로그램명을 직접 입력해주세요."
            })

        if program and new_program_name:
            raise serializers.ValidationError({
                "program":
                    "기존 프로그램 선택과 직접 입력을 동시에 사용할 수 없습니다."
            })

        if program and subfacility:
            if program.facility_id != subfacility.facility_id:
                raise serializers.ValidationError({
                    "subfacility":
                        "선택한 프로그램과 세부시설의 시설이 일치하지 않습니다."
                })

            if (
                program.subfacility_id is not None
                and program.subfacility_id != subfacility.id
            ):
                raise serializers.ValidationError({
                    "subfacility":
                        "선택한 프로그램은 해당 세부시설의 프로그램이 아닙니다."
                })

        if new_program_name:
            if not facility_id:
                raise serializers.ValidationError({
                    "facility":
                        "시설을 선택해주세요."
                })

            if subfacility and subfacility.facility_id != facility_id:
                raise serializers.ValidationError({
                    "subfacility":
                        "선택한 시설에 속하지 않는 세부시설입니다."
                })

        return data


class MyReviewSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(
        source="facility.facility_name",
        read_only=True
    )

    subfacility_name = serializers.CharField(
        source="subfacility.subfacility_name",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Review
        fields = [
            "id",
            "facility",
            "facility_name",
            "subfacility",
            "subfacility_name",
            "rating",
            "content",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "별점은 1점부터 5점 사이여야 합니다."
            )
        return value

    def validate(self, data):
        facility = data.get(
            "facility",
            getattr(self.instance, "facility", None)
        )
        subfacility = data.get(
            "subfacility",
            getattr(self.instance, "subfacility", None)
        )

        if (
            facility
            and subfacility
            and subfacility.facility_id != facility.id
        ):
            raise serializers.ValidationError({
                "subfacility":
                    "선택한 세부시설이 해당 시설에 속하지 않습니다."
            })

        return data
