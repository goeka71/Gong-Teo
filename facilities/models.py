from django.db import models
from django.conf import settings


class Facility(models.Model):
    facility_name = models.CharField("시설명", max_length=100)
    image = models.ImageField("이미지", upload_to="facilities/", null=True, blank=True)
    addr = models.CharField("주소", max_length=200)
    latit = models.FloatField("위도")
    longit = models.FloatField("경도")
    station = models.CharField("가까운역", max_length=100, blank=True)
    bus = models.CharField("가까운정류장", max_length=100, blank=True)
    station_wt = models.IntegerField("역 도보시간", null=True, blank=True)
    bus_wt = models.IntegerField("정류장 도보시간", null=True, blank=True)

    def __str__(self):
        return self.facility_name


class SubFacility(models.Model):
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="sub_facilities"
    )
    subfacility_name = models.CharField("세부시설명", max_length=100)

    def __str__(self):
        return f"{self.facility.facility_name} - {self.subfacility_name}"


class FacilityDetail(models.Model):
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="details"
    )
    op_hour = models.CharField("운영시간", max_length=100, blank=True)
    in_out = models.CharField("실내외 구분", max_length=20, blank=True)
    phone = models.CharField("전화번호", max_length=20, blank=True)
    website = models.URLField("URL", blank=True)
    fee = models.CharField("이용료", max_length=100, blank=True)
    shower = models.BooleanField("샤워실 유무", default=False)
    parking = models.BooleanField("주차장 유무", default=False)
    created_at = models.DateTimeField("작성일시", auto_now_add=True)

    def __str__(self):
        return f"{self.facility.facility_name} 상세정보"


class Sport(models.Model):
    sport_name = models.CharField("종목명", max_length=50, unique=True)

    def __str__(self):
        return self.sport_name


class FacilitySport(models.Model):
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="facility_sports"
    )
    sport = models.ForeignKey(
        Sport, on_delete=models.CASCADE, related_name="facility_sports"
    )

    class Meta:
        unique_together = ("facility", "sport")  # 같은 시설-종목 중복 방지

    def __str__(self):
        return f"{self.facility.facility_name} - {self.sport.sport_name}"


class Program(models.Model):
    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        related_name="programs"
    )

    # 이 프로그램이 진행되는 세부시설
    # 세부시설이 없는 경우에는 비워둘 수 있음
    subfacility = models.ForeignKey(
        SubFacility,
        on_delete=models.SET_NULL,
        related_name="programs",
        null=True,
        blank=True
    )

    program_name = models.CharField(
        "프로그램명",
        max_length=200
    )

    program_day = models.CharField(
        "수업 요일",
        max_length=50,
        blank=True
    )

    program_cap = models.IntegerField(
        "수용인원",
        null=True,
        blank=True
    )

    program_time = models.CharField(
        "수업 시간",
        max_length=50,
        blank=True
    )

    def __str__(self):
        return self.program_name


class Review(models.Model):
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="reviews"
    )
    subfacility = models.ForeignKey(
        SubFacility, on_delete=models.CASCADE,
        related_name="reviews", null=True, blank=True
    )
    # 특정 프로그램에 대한 리뷰인 경우에만 설정.
    # 비어 있으면 시설 자체에 대한 리뷰로 취급한다 (subfacility 와 동일한 패턴).
    program = models.ForeignKey(
        Program, on_delete=models.SET_NULL,
        related_name="reviews", null=True, blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    # 원데이 신청(oneday.OnedayApplication)으로 참여한 프로그램에 대한
    # 리뷰인 경우 True. 조회 화면에서 프로그램명 앞에 "(원데이)" 를
    # 붙이는 데만 쓰이는 표시용 플래그라 원본 신청 건과의 FK 연결은 두지 않는다.
    is_oneday = models.BooleanField("원데이 리뷰 여부", default=False)
    rating = models.IntegerField("별점")
    content = models.TextField("리뷰내용", blank=True)
    image = models.ImageField(
        "사진", upload_to="reviews/", null=True, blank=True
    )
    created_at = models.DateTimeField("작성일시", auto_now_add=True)

    def __str__(self):
        return f"{self.facility.facility_name} 리뷰 ({self.rating}점)"


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="favorites"
    )

    class Meta:
        unique_together = ("user", "facility")  # 같은 시설 중복 찜 방지

    def __str__(self):
        return f"{self.user.username} ♥ {self.facility.facility_name}"


class SubFacilityDetail(models.Model):
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, related_name="subfacility_details"
    )
    subfacility = models.ForeignKey(
        SubFacility, on_delete=models.CASCADE, related_name="details"
    )
    category = models.CharField("카테고리", max_length=50)
    contents = models.TextField("내용")
    agree_count = models.IntegerField("동의수", default=0)
    disagree_count = models.IntegerField("비동의수", default=0)
    created_at = models.DateTimeField("작성일시", auto_now_add=True)

    def __str__(self):
        return f"{self.subfacility.subfacility_name} - {self.category}"