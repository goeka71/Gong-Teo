from django.contrib import admin
from django.utils.html import format_html

from .models import MyProgram, OnedayPost, OnedayApplication


@admin.register(MyProgram)
class MyProgramAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "program",
        "status",
        "start_date",
        "end_date",
        "proof_thumbnail",
    )
    list_display_links = ("id", "user", "program")
    list_filter = ("status",)
    search_fields = ("user__username", "program__program_name")
    # Program 이 9만 건이라 드롭다운(select)으로 렌더링하면 메모리를 크게 먹는다.
    raw_id_fields = ("program",)
    list_editable = ("status",)
    fields = (
        "user",
        "program",
        "subfacility",
        "start_date",
        "end_date",
        "program_day",
        "program_time",
        "proof_image",
        "status",
        "reject_reason",
    )
    actions = ["approve_programs", "reject_programs"]

    @admin.display(description="수강증")
    def proof_thumbnail(self, obj):
        if obj.proof_image:
            return format_html(
                '<img src="{}" style="width:60px; height:60px; object-fit:cover;" />',
                obj.proof_image.url,
            )
        return "-"

    @admin.action(description="선택한 신청 승인 처리")
    def approve_programs(self, request, queryset):
        updated = queryset.update(status="approved", reject_reason="")
        self.message_user(request, f"{updated}건을 승인 처리했습니다.")

    @admin.action(description="선택한 신청 반려 처리")
    def reject_programs(self, request, queryset):
        updated = queryset.update(status="rejected")
        self.message_user(request, f"{updated}건을 반려 처리했습니다.")


admin.site.register(OnedayPost)
admin.site.register(OnedayApplication)
