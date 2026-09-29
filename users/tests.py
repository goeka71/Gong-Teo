import tempfile
from io import BytesIO

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from facilities.models import Facility, Program, SubFacility
from oneday.models import MyProgram


def make_png():
    buffer = BytesIO()
    Image.new("RGB", (20, 20), (10, 120, 200)).save(buffer, "PNG")
    return buffer.getvalue()


class LoginHasherTests(TestCase):
    """로그인 지연 완화용 Argon2 전환(users/hashers.py, settings.PASSWORD_HASHERS) 확인.

    기존 PBKDF2 해시가 여전히 로그인되고, 로그인 성공 시 자동으로 Argon2 로
    재해시되는지가 핵심 - 이게 깨지면 기존 사용자 전원이 로그인을 못 하게 된다.
    """

    url = "/api/users/login/"

    def login(self, username, password):
        return self.client.post(
            self.url,
            {"username": username, "password": password},
            content_type="application/json",
        )

    def test_new_user_password_is_hashed_with_tuned_argon2(self):
        user = get_user_model().objects.create_user(
            username="newuser", password="pw12345!", name="새유저"
        )
        self.assertTrue(user.password.startswith("argon2$argon2id$"))
        self.assertIn("m=19456,t=2,p=1", user.password)

    def test_legacy_pbkdf2_user_can_still_log_in(self):
        user = get_user_model().objects.create_user(
            username="legacyuser", password="pw12345!", name="옛유저"
        )
        # 마이그레이션 전 실제 데이터를 흉내내서 PBKDF2 해시로 강제로 되돌린다.
        legacy_hash = make_password("pw12345!", hasher="pbkdf2_sha256")
        get_user_model().objects.filter(pk=user.pk).update(password=legacy_hash)

        response = self.login("legacyuser", "pw12345!")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_legacy_pbkdf2_user_is_upgraded_to_argon2_after_login(self):
        user = get_user_model().objects.create_user(
            username="upgradeuser", password="pw12345!", name="업그레이드"
        )
        legacy_hash = make_password("pw12345!", hasher="pbkdf2_sha256")
        get_user_model().objects.filter(pk=user.pk).update(password=legacy_hash)

        self.login("upgradeuser", "pw12345!")

        user.refresh_from_db()
        self.assertTrue(user.password.startswith("argon2$argon2id$"))

    def test_wrong_password_is_still_rejected(self):
        get_user_model().objects.create_user(
            username="wrongpw", password="correct-pw", name="틀림"
        )
        response = self.login("wrongpw", "wrong-pw")
        self.assertEqual(response.status_code, 401)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class MyProgramDirectInputTests(TestCase):
    """POST /api/users/my-programs/ 의 '목록에 없어요 · 직접 입력' 경로.

    직접 입력한 프로그램명은 같은 시설(+세부시설)에 같은 이름의 Program 이 있으면
    그것을 재사용하고, 없을 때만 새로 만든다. 초기 데이터에는 같은 이름의 행이
    여러 개 있으므로(요일/시간이 다른 것 등) 여러 개 매칭돼도 오류 없이 동작해야 한다.
    """

    url = "/api/users/my-programs/"

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="tester", password="pw", name="테스터"
        )
        cls.facility = Facility.objects.create(
            facility_name="시설1", addr="서울", latit=37.5, longit=127.0
        )
        cls.other_facility = Facility.objects.create(
            facility_name="시설2", addr="서울", latit=37.5, longit=127.0
        )
        cls.sub1 = SubFacility.objects.create(facility=cls.facility, subfacility_name="수영장")
        cls.sub2 = SubFacility.objects.create(facility=cls.facility, subfacility_name="요가실")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def program(self, name, fac=None, sub=None, **fields):
        return Program.objects.create(
            facility=fac or self.facility, subfacility=sub, program_name=name, **fields
        )

    def post_direct(self, name, **extra):
        data = {
            "facility": self.facility.id,
            "new_program_name": name,
            "start_date": "2026-10-01",
            "end_date": "2026-12-31",
            "program_day": "월,수",
            "program_time": "07:00 - 08:00",
            "proof_image": SimpleUploadedFile(
                "proof.png", make_png(), content_type="image/png"
            ),
            **extra,
        }
        return self.client.post(self.url, data, format="multipart")

    def test_reuses_the_existing_program_with_the_same_name(self):
        existing = self.program("수영 초급", sub=self.sub1)
        response = self.post_direct("수영 초급", subfacility=self.sub1.id)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Program.objects.count(), 1)
        self.assertEqual(MyProgram.objects.get().program_id, existing.id)

    def test_name_is_stripped_before_matching(self):
        existing = self.program("수영 초급", sub=self.sub1)
        response = self.post_direct("  수영 초급  ", subfacility=self.sub1.id)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Program.objects.count(), 1)
        self.assertEqual(MyProgram.objects.get().program_id, existing.id)

    def test_several_programs_with_the_same_name_reuse_the_lowest_id(self):
        # 요일/시간이 달라 서로 다른 행으로 남아 있는 같은 이름 프로그램.
        first = self.program("수영 초급", sub=self.sub1, program_day="월수")
        self.program("수영 초급", sub=self.sub1, program_day="화목")
        self.program("수영 초급", sub=self.sub1, program_day="화목", program_time="10:00~10:50")

        response = self.post_direct("수영 초급", subfacility=self.sub1.id)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Program.objects.count(), 3)  # 새로 만들지 않는다
        self.assertEqual(MyProgram.objects.get().program_id, first.id)

    def test_several_identical_rows_do_not_break_registration(self):
        rows = [self.program("다이어트댄스", program_day="월수금") for _ in range(4)]
        response = self.post_direct("다이어트댄스")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(MyProgram.objects.get().program_id, rows[0].id)

    def test_program_without_subfacility_is_matched_when_no_subfacility_is_sent(self):
        existing = self.program("자유수영")  # subfacility 없음(NULL)
        response = self.post_direct("자유수영")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(MyProgram.objects.get().program_id, existing.id)

    def test_creates_a_new_program_when_no_name_matches(self):
        response = self.post_direct("새 프로그램", subfacility=self.sub1.id)
        self.assertEqual(response.status_code, 201)
        created = Program.objects.get()
        self.assertEqual(created.program_name, "새 프로그램")
        self.assertEqual(created.facility_id, self.facility.id)
        self.assertEqual(created.subfacility_id, self.sub1.id)
        self.assertEqual(created.program_day, "월,수")
        self.assertEqual(created.program_time, "07:00 - 08:00")
        self.assertEqual(MyProgram.objects.get().program_id, created.id)

    def test_same_name_in_another_subfacility_or_facility_is_not_reused(self):
        self.program("수영 초급", sub=self.sub2)                 # 다른 세부시설
        self.program("수영 초급", fac=self.other_facility)      # 다른 시설
        response = self.post_direct("수영 초급", subfacility=self.sub1.id)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Program.objects.count(), 3)
        mine = MyProgram.objects.get().program
        self.assertEqual((mine.facility_id, mine.subfacility_id), (self.facility.id, self.sub1.id))
