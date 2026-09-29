from django.db import models
from django.conf import settings


# =========================================================
# 나의 수강 프로그램
# =========================================================
class MyProgram(models.Model):
    STATUS_CHOICES = [
        ("pending", "승인대기"),
        ("approved", "승인"),
        ("rejected", "반려"),
    ]

    # 수강 프로그램을 등록한 사용자
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="my_programs"
    )

    # 시설에 등록되어 있는 프로그램
    program = models.ForeignKey(
        "facilities.Program",
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    # 해당 프로그램을 수강하는 세부시설
    subfacility = models.ForeignKey(
        "facilities.SubFacility",
        on_delete=models.SET_NULL,
        related_name="my_programs",
        null=True,
        blank=True
    )

    # 수강 기간
    start_date = models.DateField("수강 시작일")
    end_date = models.DateField("수강 종료일")

    # 수강 요일
    # 예: "월,수,금"
    program_day = models.CharField(
        "수강 요일",
        max_length=50,
        blank=True
    )

    # 수강 시간
    # 예: "07:00 - 08:00"
    program_time = models.CharField(
        "수업 시간",
        max_length=50,
        blank=True
    )

    # 수강증 인증 이미지
    proof_image = models.ImageField(
        "수강증",
        upload_to="program_proofs/",
        null=True,
        blank=True
    )

    # 관리자 승인 상태
    status = models.CharField(
        "승인 상태",
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    # 반려되었을 경우 사유
    reject_reason = models.CharField(
        "반려 사유",
        max_length=200,
        blank=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.program.program_name}"


# =========================================================
# 원데이 클래스 양도 게시글
# =========================================================
class OnedayPost(models.Model):
    STATUS_CHOICES = [
        ("open", "모집중"),
        ("closed", "마감"),
    ]

    enroll = models.ForeignKey(
        MyProgram,
        on_delete=models.CASCADE,
        related_name="oneday_posts"
    )

    transfer_date = models.DateField("양도 날짜")

    status = models.CharField(
        "상태",
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )

    created_at = models.DateTimeField(
        "게시 일시",
        auto_now_add=True
    )

    class Meta:
        # 같은 수강 등록(enroll)의 같은 결석일로 글을 두 개 이상 만들 수 없게 한다.
        # 자리는 하나뿐인데 여러 글이 생기면 서로 다른 신청자에게 같은 자리를
        # 중복으로 내주게 된다. views.py 의 onedaypost_list(POST) 가 저장 전에
        # 먼저 같은 조건으로 걸러주지만, 동시 요청(더블클릭 등) 경쟁 상황까지
        # 막으려면 DB 제약이 최종 방어선으로 필요하다.
        constraints = [
            models.UniqueConstraint(
                fields=["enroll", "transfer_date"],
                name="unique_enroll_transfer_date",
            )
        ]

    def __str__(self):
        return f"{self.enroll.program.program_name} - {self.transfer_date}"


# =========================================================
# 원데이 클래스 신청
# =========================================================
class OnedayApplication(models.Model):
    RESULT_CHOICES = [
        ("waiting", "대기"),
        ("assigned", "배정"),
        ("rejected", "미배정"),
    ]

    post = models.ForeignKey(
        OnedayPost,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="oneday_applications"
    )

    apply_at = models.DateTimeField(
        "신청 일시",
        auto_now_add=True
    )

    apply_result = models.CharField(
        "배정 결과",
        max_length=20,
        choices=RESULT_CHOICES,
        default="waiting"
    )

    def __str__(self):
        return f"{self.user.username} 신청 - {self.post.transfer_date}"