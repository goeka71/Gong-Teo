import ipaddress
import os
import socket
from io import BytesIO
from urllib.parse import unquote, urljoin, urlparse

import requests
from django.core.files.base import ContentFile
from django.utils.text import slugify
from PIL import Image

MAX_BYTES = 10 * 1024 * 1024
MAX_REDIRECTS = 3
TIMEOUT_SECONDS = 10
EXTENSIONS = {"JPEG": "jpg", "PNG": "png", "GIF": "gif", "WEBP": "webp"}


class ImageFetchError(Exception):
    pass


def _ensure_public_http_url(url):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ImageFetchError("http:// 또는 https:// 로 시작하는 주소만 사용할 수 있습니다.")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    try:
        infos = socket.getaddrinfo(parsed.hostname, port, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise ImageFetchError("주소를 찾을 수 없습니다. 주소를 다시 확인해주세요.")
    # 어드민 서버가 내부망/로컬 주소로 요청을 보내지 않도록 공인 IP만 허용한다.
    for info in infos:
        if not ipaddress.ip_address(info[4][0]).is_global:
            raise ImageFetchError("내부 네트워크 주소는 사용할 수 없습니다.")


def _download(url):
    headers = {"User-Agent": "Mozilla/5.0 (compatible; GongTeoAdmin/1.0)"}
    for _ in range(MAX_REDIRECTS + 1):
        _ensure_public_http_url(url)
        try:
            with requests.get(
                url,
                headers=headers,
                timeout=TIMEOUT_SECONDS,
                stream=True,
                allow_redirects=False,
            ) as response:
                if response.is_redirect:
                    # 리다이렉트 대상도 매번 다시 검사해야 하므로 직접 따라간다.
                    url = urljoin(url, response.headers.get("Location", ""))
                    continue
                if response.status_code != 200:
                    raise ImageFetchError(
                        f"이미지를 가져오지 못했습니다. (HTTP {response.status_code}) "
                        "사이트가 외부 접근을 막았을 수 있으니, 이미지를 복사해서 붙여넣거나 파일로 올려주세요."
                    )
                data = bytearray()
                for chunk in response.iter_content(64 * 1024):
                    data.extend(chunk)
                    if len(data) > MAX_BYTES:
                        raise ImageFetchError("이미지 용량이 너무 큽니다. (최대 10MB)")
                return url, bytes(data)
        except requests.RequestException:
            raise ImageFetchError("이미지를 가져오지 못했습니다. 주소를 다시 확인해주세요.")
    raise ImageFetchError("주소가 너무 여러 번 다른 곳으로 이동합니다.")


def fetch_image(url):
    final_url, data = _download(url)

    try:
        with Image.open(BytesIO(data)) as image:
            image.verify()
            image_format = image.format
    except Exception:
        raise ImageFetchError("이미지 파일이 아닙니다. 이미지 자체의 주소(이미지 주소 복사)를 넣어주세요.")

    extension = EXTENSIONS.get(image_format)
    if extension is None:
        raise ImageFetchError("지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WEBP만 가능)")

    stem = os.path.splitext(os.path.basename(unquote(urlparse(final_url).path)))[0]
    name = f"{slugify(stem) or 'facility'}.{extension}"
    return ContentFile(data, name=name)
