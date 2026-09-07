from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    MyProgram,
    OnedayPost,
    OnedayApplication,
)

from .serializers import (
    MyProgramSerializer,
    OnedayPostSerializer,
    OnedayApplicationSerializer,
)


@api_view(["GET"])
def myprogram_list(request):
    data = MyProgram.objects.select_related(
        "user",
        "program",
        "program__facility",
    ).all()

    serializer = MyProgramSerializer(data, many=True)

    return Response(serializer.data)


@api_view(["GET"])
def onedaypost_list(request):
    data = OnedayPost.objects.select_related(
        "enroll",
        "enroll__program",
        "enroll__program__facility",
    ).all()

    serializer = OnedayPostSerializer(data, many=True)

    return Response(serializer.data)


@api_view(["GET"])
def onedayapplication_list(request):
    data = OnedayApplication.objects.select_related(
        "post",
        "user",
    ).all()

    serializer = OnedayApplicationSerializer(data, many=True)

    return Response(serializer.data)