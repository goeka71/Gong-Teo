from rest_framework import serializers
from .models import User, CoinHistory


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