import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "슈퍼유저가 하나도 없으면 환경변수로 슈퍼유저를 생성합니다"

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING("이미 슈퍼유저 있음, 건너뜀"))
            return

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME/PASSWORD 환경변수 없음, 건너뜀"
            ))
            return

        User.objects.create_superuser(
            username=username,
            email=email or "",
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f"슈퍼유저 '{username}' 생성 완료"))
