import tempfile
from io import BytesIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from .image_fetch import ImageFetchError, fetch_image
from .models import Facility


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
