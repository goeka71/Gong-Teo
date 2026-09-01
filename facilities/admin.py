from django.contrib import admin
from .models import (
    Facility, SubFacility, FacilityDetail,
    Sport, FacilitySport, Program, Review, Favorite, SubFacilityDetail
)

admin.site.register(Facility)
admin.site.register(SubFacility)
admin.site.register(FacilityDetail)
admin.site.register(Sport)
admin.site.register(FacilitySport)
@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    search_fields = ("program_name",)
admin.site.register(Review)
admin.site.register(Favorite)
admin.site.register(SubFacilityDetail)