import csv
import os
import tempfile
from io import BytesIO, StringIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from .image_fetch import ImageFetchError, fetch_image
from .models import Facility, Program, SubFacility
from .views import ProgramPagination


def make_image_bytes(image_format="PNG"):
    buffer = BytesIO()
    Image.new("RGB", (20, 20), (10, 120, 200)).save(buffer, image_format)
    return buffer.getvalue()


def fake_response(status=200, body=b"", headers=None, redirect=False):
    response = mock.MagicMock()
    response.status_code = status
    response.headers = headers or {}
    response.is_redirect = redirect
    response.iter_content.return_value = [body]
    response.__enter__.return_value = response
    return response


PUBLIC_DNS = [(None, None, None, None, ("93.184.216.34", 443))]


@mock.patch("facilities.image_fetch.socket.getaddrinfo", return_value=PUBLIC_DNS)
class FetchImageTests(TestCase):
    @mock.patch("facilities.image_fetch.requests.get")
    def test_downloads_image_and_names_it_after_url(self, get, _dns):
        get.return_value = fake_response(body=make_image_bytes("PNG"))
        result = fetch_image("https://example.com/photos/Pool%20Front.jpg?size=big")
        self.assertEqual(result.name, "pool-front.png")
        self.assertEqual(result.read(), make_image_bytes("PNG"))

    @mock.patch("facilities.image_fetch.requests.get")
    def test_rejects_non_image_body(self, get, _dns):
        get.return_value = fake_response(body=b"<html>not an image</html>")
        with self.assertRaisesMessage(ImageFetchError, "이미지 파일이 아닙니다"):
            fetch_image("https://example.com/page")

    @mock.patch("facilities.image_fetch.requests.get")
    def test_rejects_http_error_status(self, get, _dns):
        get.return_value = fake_response(status=403)
        with self.assertRaisesMessage(ImageFetchError, "HTTP 403"):
            fetch_image("https://example.com/a.jpg")

    @mock.patch("facilities.image_fetch.MAX_BYTES", 100)
    @mock.patch("facilities.image_fetch.requests.get")
    def test_rejects_oversized_image(self, get, _dns):
        get.return_value = fake_response(body=b"x" * 101)
        with self.assertRaisesMessage(ImageFetchError, "용량"):
            fetch_image("https://example.com/a.jpg")

    @mock.patch("facilities.image_fetch.requests.get")
    def test_follows_redirect_and_uses_final_url(self, get, _dns):
        get.side_effect = [
            fake_response(status=302, headers={"Location": "/real/photo.png"}, redirect=True),
            fake_response(body=make_image_bytes("PNG")),
        ]
        result = fetch_image("https://example.com/short")
        self.assertEqual(result.name, "photo.png")

    @mock.patch("facilities.image_fetch.requests.get")
    def test_redirect_loop_is_stopped(self, get, _dns):
        get.return_value = fake_response(status=302, headers={"Location": "/again"}, redirect=True)
        with self.assertRaisesMessage(ImageFetchError, "너무 여러 번"):
            fetch_image("https://example.com/loop")


class FetchImageSafetyTests(TestCase):
    @mock.patch("facilities.image_fetch.requests.get")
    def test_blocks_private_and_loopback_addresses(self, get):
        for url in (
            "http://127.0.0.1:8000/admin/",
            "http://localhost/a.png",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.5/a.png",
        ):
            with self.subTest(url=url):
                with self.assertRaisesMessage(ImageFetchError, "내부 네트워크"):
                    fetch_image(url)
        get.assert_not_called()

    @mock.patch("facilities.image_fetch.requests.get")
    def test_blocks_redirect_to_private_address(self, get):
        get.return_value = fake_response(
            status=302, headers={"Location": "http://127.0.0.1/secret.png"}, redirect=True
        )
        with mock.patch(
            "facilities.image_fetch.socket.getaddrinfo",
            side_effect=lambda host, *a, **k: (
                PUBLIC_DNS if host == "example.com" else [(None, None, None, None, ("127.0.0.1", 80))]
            ),
        ):
            with self.assertRaisesMessage(ImageFetchError, "내부 네트워크"):
                fetch_image("https://example.com/redirect")
        self.assertEqual(get.call_count, 1)

    def test_rejects_non_http_scheme(self):
        with self.assertRaisesMessage(ImageFetchError, "http://"):
            fetch_image("file:///etc/passwd")


@override_settings(
    MEDIA_ROOT=tempfile.mkdtemp(),
    # collectstatic 없이도 어드민 페이지가 렌더링되도록 manifest 저장소를 쓰지 않는다.
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)
class FacilityAdminImageTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = get_user_model().objects.create_superuser(
            username="admin", email="a@example.com", password="pw"
        )
        cls.facility = Facility.objects.create(
            facility_name="테스트시설", addr="서울", latit=37.5, longit=127.0
        )

    def setUp(self):
        self.client.force_login(self.admin_user)
        self.url = reverse("admin:facilities_facility_change", args=[self.facility.pk])

    def post(self, **extra):
        data = {
            "facility_name": "테스트시설",
            "addr": "서울",
            "latit": "37.5",
            "longit": "127.0",
            "station": "",
            "bus": "",
            **extra,
        }
        return self.client.post(self.url, data)

    def test_change_page_shows_url_field_and_paste_script(self):
        response = self.client.get(self.url)
        self.assertContains(response, 'name="image_url"')
        self.assertContains(response, "facilities/admin_image_paste.js")

    @mock.patch("facilities.admin.fetch_image")
    def test_image_url_is_fetched_and_saved(self, fetch):
        fetch.return_value = ContentFile(make_image_bytes("PNG"), name="from-web.png")
        response = self.post(image_url="https://example.com/from-web.png")
        self.assertEqual(response.status_code, 302)
        self.facility.refresh_from_db()
        self.assertTrue(self.facility.image.name.startswith("facilities/from-web"))
        self.assertTrue(self.facility.image.name.endswith(".png"))

    @mock.patch("facilities.admin.fetch_image")
    def test_fetch_failure_is_shown_as_form_error(self, fetch):
        fetch.side_effect = ImageFetchError("이미지 파일이 아닙니다.")
        response = self.post(image_url="https://example.com/page")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "이미지 파일이 아닙니다.")
        self.facility.refresh_from_db()
        self.assertFalse(self.facility.image)

    @mock.patch("facilities.admin.fetch_image")
    def test_file_and_url_together_is_rejected(self, fetch):
        upload = SimpleUploadedFile("up.png", make_image_bytes("PNG"), content_type="image/png")
        response = self.post(image=upload, image_url="https://example.com/a.png")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "하나만 사용")
        fetch.assert_not_called()

    def test_plain_file_upload_still_works(self):
        upload = SimpleUploadedFile("up.png", make_image_bytes("PNG"), content_type="image/png")
        response = self.post(image=upload)
        self.assertEqual(response.status_code, 302)
        self.facility.refresh_from_db()
        self.assertTrue(self.facility.image.name.startswith("facilities/up"))


class ProgramListSearchTests(TestCase):
    """GET /api/facilities/programs/ : 필수 파라미터, q 검색, 페이지네이션, 정렬

    응답은 {count, next, previous, results} 형태의 페이지네이션 응답이다.
    """

    @classmethod
    def setUpTestData(cls):
        def facility(name):
            return Facility.objects.create(
                facility_name=name, addr="서울", latit=37.5, longit=127.0
            )

        cls.f1 = facility("시설1")
        cls.f2 = facility("시설2")
        cls.f3 = facility("시설3(대량)")
        cls.sub1 = SubFacility.objects.create(facility=cls.f1, subfacility_name="수영장")
        cls.sub2 = SubFacility.objects.create(facility=cls.f1, subfacility_name="요가실")

        def program(fac, name, sub=None):
            return Program.objects.create(facility=fac, subfacility=sub, program_name=name)

        program(cls.f1, "수영 초급", cls.sub1)
        program(cls.f1, "수영 고급", cls.sub1)
        program(cls.f1, "요가 기초", cls.sub2)
        program(cls.f1, "Yoga Basic")          # 세부시설 없음(NULL)
        program(cls.f1, "필라테스")
        program(cls.f2, "수영 초급")            # 다른 시설의 같은 이름

    url = "/api/facilities/programs/"
    page_size = ProgramPagination.page_size

    def get(self, **params):
        return self.client.get(self.url, params)

    def results(self, response):
        return response.json()["results"]

    def names(self, response):
        return [p["program_name"] for p in self.results(response)]

    # ---- 필수 파라미터 (기존 동작 유지) ----
    def test_no_params_is_400(self):
        response = self.get()
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())

    def test_empty_facility_and_subfacility_is_400(self):
        self.assertEqual(self.get(facility="", subfacility="").status_code, 400)

    def test_q_alone_does_not_bypass_required_params(self):
        self.assertEqual(self.get(q="수영").status_code, 400)

    # ---- 기본 조회 / 정렬 ----
    def test_facility_only_returns_that_facilitys_programs_sorted_by_name(self):
        response = self.get(facility=self.f1.id)
        self.assertEqual(response.status_code, 200)
        names = self.names(response)
        self.assertEqual(sorted(names), sorted(
            ["수영 초급", "수영 고급", "요가 기초", "Yoga Basic", "필라테스"]
        ))
        self.assertEqual(names, sorted(names))  # 이름순

    def test_same_name_is_ordered_by_id(self):
        # 요일이 달라 묶이지 않는 같은 이름 프로그램은 id 순으로 나온다.
        first = Program.objects.create(facility=self.f2, program_name="동명", program_day="월수")
        second = Program.objects.create(facility=self.f2, program_name="동명", program_day="화목")
        ids = [p["id"] for p in self.results(self.get(facility=self.f2.id, q="동명"))]
        self.assertEqual(ids, [first.id, second.id])

    def test_subfacility_filter(self):
        response = self.get(facility=self.f1.id, subfacility=self.sub1.id)
        self.assertEqual(sorted(self.names(response)), ["수영 고급", "수영 초급"])

    # ---- q 검색 ----
    def test_q_filters_by_program_name_within_facility(self):
        response = self.get(facility=self.f1.id, q="수영")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(sorted(self.names(response)), ["수영 고급", "수영 초급"])
        # 시설2 의 같은 이름 프로그램은 섞이지 않는다
        self.assertEqual(len(self.results(self.get(facility=self.f2.id, q="수영"))), 1)

    def test_q_matches_substring_anywhere(self):
        self.assertEqual(self.names(self.get(facility=self.f1.id, q="급")),
                         ["수영 고급", "수영 초급"])

    def test_q_is_case_insensitive(self):
        self.assertEqual(self.names(self.get(facility=self.f1.id, q="yOGA")), ["Yoga Basic"])

    def test_q_is_stripped_and_blank_q_means_no_filter(self):
        self.assertEqual(self.names(self.get(facility=self.f1.id, q="  수영  ")),
                         ["수영 고급", "수영 초급"])
        self.assertEqual(len(self.results(self.get(facility=self.f1.id, q="   "))), 5)

    def test_q_without_match_returns_empty_results(self):
        response = self.get(facility=self.f1.id, q="없는프로그램")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(self.results(response), [])

    def test_q_combines_with_subfacility(self):
        response = self.get(facility=self.f1.id, subfacility=self.sub1.id, q="고급")
        self.assertEqual(self.names(response), ["수영 고급"])
        # 다른 세부시설의 프로그램은 q 가 맞아도 나오지 않는다
        self.assertEqual(
            self.results(self.get(facility=self.f1.id, subfacility=self.sub2.id, q="수영")), []
        )

    def test_like_wildcards_in_q_are_literal(self):
        self.assertEqual(self.results(self.get(facility=self.f1.id, q="%")), [])
        self.assertEqual(self.results(self.get(facility=self.f1.id, q="_")), [])

    # ---- 같은 항목 묶기 ----
    # 시설·세부시설·이름·요일·시간이 모두 같은 행은 가장 작은 id 하나만 내려준다.
    def _make(self, name, fac=None, sub=None, **fields):
        return Program.objects.create(
            facility=fac or self.f3, subfacility=sub, program_name=name, **fields
        )

    def test_identical_rows_collapse_to_the_lowest_id(self):
        rows = [
            self._make("다이어트댄스", program_day="월수금", program_time="19:00~19:50")
            for _ in range(5)
        ]
        response = self.get(facility=self.f3.id)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual([p["id"] for p in self.results(response)], [rows[0].id])

    def test_rows_differing_only_in_capacity_collapse(self):
        first = self._make("수영", program_day="월", program_time="09:00~09:50", program_cap=0)
        self._make("수영", program_day="월", program_time="09:00~09:50", program_cap=20)
        response = self.get(facility=self.f3.id)
        self.assertEqual([p["id"] for p in self.results(response)], [first.id])

    def test_different_day_or_time_stay_separate(self):
        self._make("수영", program_day="월수", program_time="09:00~09:50")
        self._make("수영", program_day="화목", program_time="09:00~09:50")
        self._make("수영", program_day="월수", program_time="10:00~10:50")
        self.assertEqual(self.get(facility=self.f3.id).json()["count"], 3)

    def test_blank_time_and_filled_time_stay_separate(self):
        self._make("자율탁구", program_day="화목", program_time="")
        self._make("자율탁구", program_day="화목", program_time="12:00~13:50")
        self.assertEqual(self.get(facility=self.f3.id).json()["count"], 2)

    def test_different_subfacility_stays_separate(self):
        self._make("수영", fac=self.f1, sub=self.sub1, program_day="월")
        self._make("수영", fac=self.f1, sub=self.sub2, program_day="월")
        # 시드의 "수영 초급/고급"(sub1) 2건 + 새로 만든 "수영"(sub1, sub2) 2건
        self.assertEqual(self.get(facility=self.f1.id, q="수영").json()["count"], 4)
        # sub1 만 보면 시드 2건 + "수영" 1건
        response = self.get(facility=self.f1.id, subfacility=self.sub1.id, q="수영")
        self.assertEqual(sorted(self.names(response)), ["수영", "수영 고급", "수영 초급"])

    def test_grouping_is_applied_within_the_filtered_result(self):
        self._make("수영", fac=self.f1, sub=self.sub1, program_day="월")
        self._make("수영", fac=self.f1, sub=self.sub1, program_day="월")
        response = self.get(facility=self.f1.id, subfacility=self.sub1.id, q="수영")
        # 시드의 "수영 초급/고급"(sub1) + 새로 만든 "수영"(중복 2행 → 1행)
        self.assertEqual(sorted(self.names(response)), ["수영", "수영 고급", "수영 초급"])

    def test_count_and_pages_use_grouped_rows(self):
        # 서로 다른 이름 (page_size + 10)개를 각각 3행씩 → 묶으면 page_size + 10 항목
        for i in range(self.page_size + 10):
            for _ in range(3):
                self._make(f"프로그램-{i:03d}", program_day="월")
        first_page = self.get(facility=self.f3.id).json()
        second_page = self.get(facility=self.f3.id, page=2).json()
        self.assertEqual(first_page["count"], self.page_size + 10)
        self.assertEqual(len(first_page["results"]), self.page_size)
        self.assertEqual(len(second_page["results"]), 10)

    def test_response_fields_are_unchanged(self):
        self._make("수영", program_day="월", program_time="09:00~09:50", program_cap=8)
        item = self.results(self.get(facility=self.f3.id))[0]
        self.assertEqual(
            set(item),
            {"id", "facility", "subfacility", "program_name",
             "program_day", "program_cap", "program_time"},
        )

    # ---- 페이지네이션 ----
    def _bulk(self, prefix, count):
        Program.objects.bulk_create([
            Program(facility=self.f3, program_name=f"{prefix}-{i:03d}")
            for i in range(count)
        ])

    def test_first_page_has_page_size_items_and_reports_total(self):
        self._bulk("일반", self.page_size + 10)
        data = self.get(facility=self.f3.id).json()
        self.assertEqual(len(data["results"]), self.page_size)
        self.assertEqual(data["count"], self.page_size + 10)
        self.assertIsNotNone(data["next"])
        self.assertIsNone(data["previous"])

    def test_second_page_has_the_remainder(self):
        self._bulk("일반", self.page_size + 10)
        data = self.get(facility=self.f3.id, page=2).json()
        self.assertEqual(len(data["results"]), 10)
        self.assertIsNone(data["next"])
        self.assertIsNotNone(data["previous"])

    def test_pagination_applies_with_q_too(self):
        self._bulk("수영반", self.page_size + 10)
        self._bulk("요가반", 5)
        data = self.get(facility=self.f3.id, q="수영").json()
        names = [p["program_name"] for p in data["results"]]
        self.assertEqual(len(names), self.page_size)
        self.assertEqual(data["count"], self.page_size + 10)
        self.assertTrue(all("수영" in n for n in names))

    def test_pages_keep_name_order_without_gaps_or_overlap(self):
        self._bulk("프로그램", self.page_size + 10)
        names = (
            self.names(self.get(facility=self.f3.id, page=1))
            + self.names(self.get(facility=self.f3.id, page=2))
        )
        expected = [f"프로그램-{i:03d}" for i in range(self.page_size + 10)]
        self.assertEqual(names, expected)

    def test_search_finds_program_beyond_the_first_page(self):
        """첫 페이지에는 안 보이는 프로그램도 q 로는 찾을 수 있어야 한다."""
        self._bulk("가나다", self.page_size + 10)
        Program.objects.create(facility=self.f3, program_name="힣마지막프로그램")
        self.assertNotIn("힣마지막프로그램", self.names(self.get(facility=self.f3.id)))
        self.assertEqual(self.names(self.get(facility=self.f3.id, q="마지막")),
                         ["힣마지막프로그램"])

    def test_page_size_param_is_capped_at_max_page_size(self):
        self._bulk("일반", ProgramPagination.max_page_size + 10)
        data = self.get(facility=self.f3.id, page_size=1000).json()
        self.assertEqual(len(data["results"]), ProgramPagination.max_page_size)


class ImportDataSubfacilityTests(TestCase):
    """import_data 가 program.csv 의 subfacility_id 로 Program 과 세부시설을 연결한다.

    subfacility_id 는 "subfacility.csv 의 N번째 행" 을 뜻한다. 실제 DB id 는 시퀀스
    상태에 따라 N 과 다를 수 있으므로(Postgres 는 롤백돼도 시퀀스가 안 돌아간다)
    번호가 아니라 '만들어진 SubFacility' 로 연결돼야 한다.
    """

    FACILITIES = [
        {"id": 1, "facility_name": "시설A", "imagfe": "", "addr": "서울", "latit": 37.5,
         "longit": 127.0, "station": "", "station_wt": "", "bus": "", "bus_wt": ""},
        {"id": 2, "facility_name": "시설B", "imagfe": "", "addr": "서울", "latit": 37.6,
         "longit": 127.1, "station": "", "station_wt": "", "bus": "", "bus_wt": ""},
    ]
    # N번째 행 = 세부시설 N
    SUBFACILITIES = [
        {"facility_id": 1, "subfacility_name": "수영장"},   # 1
        {"facility_id": 1, "subfacility_name": "요가실"},   # 2
        {"facility_id": 2, "subfacility_name": "탁구장"},   # 3
    ]

    def run_import(self, programs, subfacilities=None, program_fields=None):
        """임시 폴더에 작은 csv 들을 만들고 import_data 를 실행한다."""
        program_fields = program_fields or [
            "facility_id", "subfacility_id", "program_name",
            "program_day", "program_cap", "program_time",
        ]
        tables = {
            "facility.csv": (list(self.FACILITIES[0]), self.FACILITIES),
            "sport.csv": (["id", "sport_name"], [{"id": 1, "sport_name": "수영"}]),
            "subfacility.csv": (
                ["facility_id", "subfacility_name"],
                self.SUBFACILITIES if subfacilities is None else subfacilities,
            ),
            "facility_sport.csv": (
                ["facility_id", "sport_id"], [{"facility_id": 1, "sport_id": 1}]
            ),
            "program.csv": (program_fields, programs),
            "facility_detail.csv": (
                ["facility_id", "phone", "website", "in_out", "op_hour", "fee",
                 "shower", "parking"],
                [],
            ),
        }
        with tempfile.TemporaryDirectory() as directory:
            for name, (fields, rows) in tables.items():
                with open(os.path.join(directory, name), "w", encoding="utf-8-sig", newline="") as f:
                    writer = csv.DictWriter(f, fieldnames=fields)
                    writer.writeheader()
                    writer.writerows(rows)

            out = StringIO()
            with mock.patch("facilities.management.commands.import_data.DATA_DIR", directory):
                call_command("import_data", stdout=out)
        return out.getvalue()

    @staticmethod
    def program(facility_id, subfacility_id, name):
        return {
            "facility_id": facility_id, "subfacility_id": subfacility_id,
            "program_name": name, "program_day": "월", "program_cap": 0, "program_time": "",
        }

    def linked_name(self, program_name):
        program = Program.objects.get(program_name=program_name)
        return program.subfacility.subfacility_name if program.subfacility else None

    def test_programs_are_linked_to_the_subfacility_in_the_csv(self):
        self.run_import([
            self.program(1, 1, "수영 초급"),
            self.program(1, 2, "요가 기초"),
            self.program(2, 3, "탁구 초급"),
        ])
        self.assertEqual(self.linked_name("수영 초급"), "수영장")
        self.assertEqual(self.linked_name("요가 기초"), "요가실")
        self.assertEqual(self.linked_name("탁구 초급"), "탁구장")

    def test_blank_subfacility_id_stays_null(self):
        self.run_import([self.program(1, "", "자유수영")])
        self.assertIsNone(Program.objects.get().subfacility_id)

    def test_program_csv_without_subfacility_column_still_imports(self):
        # subfacility_id 컬럼이 없던 옛 csv 형식
        fields = ["facility_id", "program_name", "program_day", "program_cap", "program_time"]
        rows = [{k: v for k, v in self.program(1, 1, "수영 초급").items() if k in fields}]
        self.run_import(rows, program_fields=fields)
        program = Program.objects.get()
        self.assertEqual(program.program_name, "수영 초급")
        self.assertIsNone(program.subfacility_id)

    def test_linking_follows_csv_order_even_if_db_ids_are_shifted(self):
        # 운영 Postgres 처럼 시퀀스가 밀린 상황: 앞선 (롤백된) 시도가 id 를 소비했다.
        # SQLite 는 AUTOINCREMENT 라 지운 id 를 재사용하지 않아서 같은 상황이 된다.
        facility = Facility.objects.create(facility_name="임시", addr="x", latit=0, longit=0)
        for _ in range(5):
            SubFacility.objects.create(facility=facility, subfacility_name="임시").delete()
        facility.delete()

        self.run_import([
            self.program(1, 1, "수영 초급"),
            self.program(2, 3, "탁구 초급"),
        ])

        # 실제 id 가 CSV 번호(1, 3)와 어긋나 있는지 먼저 확인한다 (테스트 전제)
        self.assertNotEqual(SubFacility.objects.get(subfacility_name="수영장").id, 1)
        # 그래도 올바른 세부시설에 연결된다
        self.assertEqual(self.linked_name("수영 초급"), "수영장")
        self.assertEqual(self.linked_name("탁구 초급"), "탁구장")

    def test_subfacility_of_another_facility_is_not_linked(self):
        # 시설 2 의 프로그램이 시설 1 의 세부시설(1번)을 가리키면 연결하지 않는다.
        output = self.run_import([self.program(2, 1, "탁구 초급")])
        program = Program.objects.get()
        self.assertEqual(program.facility_id, 2)
        self.assertIsNone(program.subfacility_id)
        self.assertIn("잘못된 Program 1개", output)

    def test_out_of_range_or_non_numeric_subfacility_id_is_not_linked(self):
        output = self.run_import([
            self.program(1, 99, "범위 밖"),
            self.program(1, "abc", "숫자 아님"),
            self.program(1, 1, "정상"),
        ])
        self.assertIsNone(Program.objects.get(program_name="범위 밖").subfacility_id)
        self.assertIsNone(Program.objects.get(program_name="숫자 아님").subfacility_id)
        self.assertEqual(self.linked_name("정상"), "수영장")
        self.assertEqual(Program.objects.count(), 3)  # 잘못된 값이 있어도 프로그램은 들어간다
        self.assertIn("잘못된 Program 2개", output)

    def test_summary_reports_how_many_programs_were_linked(self):
        output = self.run_import([
            self.program(1, 1, "수영 초급"),
            self.program(1, "", "자유수영"),
        ])
        self.assertIn("세부시설 연결 1개", output)

    def test_second_run_is_skipped_when_data_exists(self):
        self.run_import([self.program(1, 1, "수영 초급")])
        output = self.run_import([self.program(1, 2, "요가 기초")])
        self.assertIn("이미 데이터 있음", output)
        self.assertEqual(Program.objects.count(), 1)
