from django import forms
from django.contrib import admin
from django.core.files.uploadedfile import UploadedFile

from .image_fetch import ImageFetchError, fetch_image
from .models import (
    Facility, SubFacility, FacilityDetail,
    Sport, FacilitySport, Program, Review, Favorite, SubFacilityDetail
)


class FacilityAdminForm(forms.ModelForm):
    image_url = forms.URLField(
        label="이미지 주소로 등록",
        required=False,
        help_text=(
            "웹에서 이미지를 우클릭 → '이미지 주소 복사'한 주소를 붙여넣으면 저장할 때 "
            "자동으로 가져와 등록합니다. (이미지를 복사해서 이 화면에 붙여넣기(Ctrl/⌘+V)해도 됩니다)"
        ),
    )

    class Meta:
        model = Facility
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        image_url = cleaned_data.get("image_url")
        if not image_url:
            return cleaned_data

        if isinstance(cleaned_data.get("image"), UploadedFile):
            self.add_error("image_url", "이미지 파일과 이미지 주소 중 하나만 사용해주세요.")
            return cleaned_data

        try:
            cleaned_data["image"] = fetch_image(image_url)
        except ImageFetchError as exc:
            self.add_error("image_url", str(exc))
        return cleaned_data


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    form = FacilityAdminForm
    fields = (
        "facility_name", "image", "image_url", "addr", "latit", "longit",
        "station", "bus", "station_wt", "bus_wt",
    )

    class Media:
        js = ("facilities/admin_image_paste.js",)


admin.site.register(SubFacility)
admin.site.register(FacilityDetail)
admin.site.register(Sport)
admin.site.register(FacilitySport)
admin.site.register(Program)
admin.site.register(Review)
admin.site.register(Favorite)
admin.site.register(SubFacilityDetail)
