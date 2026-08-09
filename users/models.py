from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # AbstractUser가 username, password, email, first_name 등을 이미 제공.
    # 여기엔 우리만의 추가 필드만.
    name = models.CharField("성명", max_length=50)
    birth = models.DateField("생년월일", null=True, blank=True)
    phone = models.CharField("전화번호", max_length=20, blank=True)
    coin = models.IntegerField("코인", default=5)   # 가입 시 5개 지급

    def __str__(self):
        return f"{self.username} ({self.name})"


class CoinHistory(models.Model):
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name="coin_histories"
    )
    coin_desc = models.CharField("코인 내역", max_length=100)
    coin_res = models.IntegerField("거래 결과 코인 개수")   # 거래 후 잔액
    created_at = models.DateTimeField("거래 일시", auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.coin_desc}"