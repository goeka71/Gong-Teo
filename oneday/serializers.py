from rest_framework import serializers

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)


class MyProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyProgram
        fields = "__all__"


class OnedayPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnedayPost
        fields = "__all__"


class OnedayApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnedayApplication
        fields = "__all__"