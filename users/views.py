from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import User, CoinHistory
from .serializers import (
    UserSerializer,
    SignupSerializer,
    CoinHistorySerializer,
)


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