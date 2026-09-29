import datetime
import json
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.validators import UniqueTogetherValidator

from facilities.models import Facility, Program
from oneday.models import MyProgram, OnedayPost


class OnedayPostDuplicateDateTests(TestCase):
    """POST /api/oneday/posts/ - 같은 수강 등록(enroll)의 같은 결석일로
    양도 글을 두 개 이상 만들 수 없어야 한다(models.OnedayPost 의
    unique_enroll_transfer_date 제약 + views.onedaypost_list 의 사전 확인).
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="giver", password="pw", name="기버"
        )
        facility = Facility.objects.create(
            facility_name="테스트시설", addr="서울", latit=37.5, longit=127.0
        )
        program = Program.objects.create(facility=facility, program_name="테스트프로그램")

        today = datetime.date.today()
        weekday_kr = ["월", "화", "수", "목", "금", "토", "일"][today.weekday()]

        cls.enroll = MyProgram.objects.create(
            user=cls.user,
            program=program,
            start_date=today - datetime.timedelta(days=10),
            end_date=today + datetime.timedelta(days=60),
            program_day=weekday_kr,
        )
        cls.transfer_date = today + datetime.timedelta(days=7)
        # transfer_date 도 today 와 같은 요일이어야 하므로 7일 뒤로 맞춘다.

        cls.other_enroll = MyProgram.objects.create(
            user=cls.user,
            program=program,
            start_date=today - datetime.timedelta(days=10),
            end_date=today + datetime.timedelta(days=60),
            program_day=weekday_kr,
        )

    def setUp(self):
        self.url = reverse("onedaypost-list")

    def post(self, enroll, transfer_date):
        return self.client.post(
            self.url,
            data=json.dumps(
                {"enroll": enroll.id, "transfer_date": str(transfer_date)}
            ),
            content_type="application/json",
        )

    def test_second_post_for_same_enroll_and_date_is_rejected(self):
        first = self.post(self.enroll, self.transfer_date)
        self.assertEqual(first.status_code, 201)

        second = self.post(self.enroll, self.transfer_date)
        self.assertEqual(second.status_code, 400)
        # OnedayPostSerializer 의 UniqueTogetherValidator 가 is_valid() 단계에서
        # 걸러내는 경로라 DRF 관례상 non_field_errors 로 온다(단, 두 요청이 거의
        # 동시에 들어와 이 단계를 둘 다 통과하는 경쟁 상황이면 views.py 의
        # IntegrityError 처리가 대신 {"detail": ...} 로 돌려준다 - 어느 쪽이든
        # 프론트의 extractServerMessage() 가 같은 한국어 메시지를 뽑아낸다).
        self.assertIn(
            "이미 이 날짜로 등록한 양도 글이 있습니다.",
            second.json()["non_field_errors"],
        )

        # DB 에도 한 건만 남아 있어야 한다.
        self.assertEqual(
            OnedayPost.objects.filter(
                enroll=self.enroll, transfer_date=self.transfer_date
            ).count(),
            1,
        )

    def test_same_date_is_allowed_for_a_different_enroll(self):
        first = self.post(self.enroll, self.transfer_date)
        self.assertEqual(first.status_code, 201)

        # 같은 날짜라도 다른(별개) 수강 등록이면 서로 다른 자리이므로 허용된다.
        second = self.post(self.other_enroll, self.transfer_date)
        self.assertEqual(second.status_code, 201)

    def test_a_different_date_is_allowed_for_the_same_enroll(self):
        first = self.post(self.enroll, self.transfer_date)
        self.assertEqual(first.status_code, 201)

        next_week = self.transfer_date + datetime.timedelta(days=7)
        second = self.post(self.enroll, next_week)
        self.assertEqual(second.status_code, 201)

    def test_model_level_unique_constraint_still_blocks_direct_db_writes(self):
        # 뷰의 사전 확인을 우회해서 모델 레벨로 바로 시도해도 막혀야 한다
        # (동시 요청 등, 사전 확인만으로는 못 막는 경쟁 상황에 대한 최종 방어선).
        OnedayPost.objects.create(
            enroll=self.enroll, transfer_date=self.transfer_date, status="open"
        )

        with self.assertRaises(Exception):
            OnedayPost.objects.create(
                enroll=self.enroll, transfer_date=self.transfer_date, status="open"
            )

    def test_view_returns_clean_400_when_race_slips_past_the_validator(self):
        # 두 요청이 거의 동시에 들어와서 serializer.is_valid() 의
        # UniqueTogetherValidator 단계를 "둘 다" 통과해버리는 경쟁 상황을
        # 흉내낸다(이 테스트에서만 그 검증기를 무력화). 이때도 DB 의
        # UniqueConstraint 가 두 번째 save() 를 막아야 하고, views.py 가
        # 그 IntegrityError 를 500 이 아니라 같은 모양의 400 으로 바꿔줘야 한다.
        OnedayPost.objects.create(
            enroll=self.enroll, transfer_date=self.transfer_date, status="open"
        )

        with mock.patch.object(UniqueTogetherValidator, "__call__", return_value=None):
            response = self.post(self.enroll, self.transfer_date)

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "이미 이 날짜로 등록한 양도 글이 있습니다.",
            response.json()["detail"],
        )
        self.assertEqual(
            OnedayPost.objects.filter(
                enroll=self.enroll, transfer_date=self.transfer_date
            ).count(),
            1,
        )
