from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import User, CoinHistory
from .serializers import UserSerializer, CoinHistorySerializer


@api_view(["GET"])
def user_list(request):
    data = User.objects.all()
    serializer = UserSerializer(data, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def coin_history_list(request):
    data = CoinHistory.objects.all()
    serializer = CoinHistorySerializer(data, many=True)
    return Response(serializer.data)
