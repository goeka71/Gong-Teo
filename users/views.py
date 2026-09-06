from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User, CoinHistory
from .serializers import (
    UserSerializer,
    SignupSerializer,
    UserUpdateSerializer,
    CoinHistorySerializer,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(["GET"])
def user_list(request):
    data = User.objects.all()
    serializer = UserSerializer(data, many=True)

    return Response(serializer.data)


@api_view(["POST"])
def signup(request):
    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
def coin_history_list(request):
    data = CoinHistory.objects.all()
    serializer = CoinHistorySerializer(data, many=True)

    return Response(serializer.data)

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def my_info(request):
    if request.method == "GET":
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    serializer = UserUpdateSerializer(
        request.user,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)

    return Response(serializer.errors, status=400)