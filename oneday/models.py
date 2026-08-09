from django.db import models
from django.conf import settings


class MyProgram(models.Model):
    STATUS_CHOICES = [
        ("pending", "승인대기"),
        ("approved", "승인"),
        ("rejected", "반려"),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="my_programs"
    )
    program = models.ForeignKey(
        'facilities.Program', on_delete=models.CASCADE, related_name="enrollments"
    )
    start_date = models.DateField("수강 시작일")
    end_date = models.DateField("수강 종료일")
    program_day = models.CharField("수강 요일", max_length=50, blank=True)
    program_time = models.CharField("수업 시간", max_length=50, blank=True)
    status = models.CharField("승인 상태", max_length=20, choices=STATUS_CHOICES, default="pending")
    reject_reason = models.CharField("반려 사유", max_length=200, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.program.program_name}"


class OnedayPost(models.Model):
    STATUS_CHOICES = [
        ("open", "모집중"),
        ("closed", "마감"),
    ]
    enroll = models.ForeignKey(
        MyProgram, on_delete=models.CASCADE, related_name="oneday_posts"
    )
    transfer_date = models.DateField("양도 날짜")
    status = models.CharField("상태", max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField("게시 일시", auto_now_add=True)

    def __str__(self):
        return f"{self.enroll.program.program_name} - {self.transfer_date}"


class OnedayApplication(models.Model):
    RESULT_CHOICES = [
        ("waiting", "대기"),
        ("assigned", "배정"),
        ("rejected", "미배정"),
    ]
    post = models.ForeignKey(
        OnedayPost, on_delete=models.CASCADE, related_name="applications"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="oneday_applications"
    )
    apply_at = models.DateTimeField("신청 일시", auto_now_add=True)
    apply_result = models.CharField("배정 결과", max_length=20, choices=RESULT_CHOICES, default="waiting")

    def __str__(self):
        return f"{self.user.username} 신청 - {self.post.transfer_date}"