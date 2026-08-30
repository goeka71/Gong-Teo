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


class CoinHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinHistory
        fields = "__all__"