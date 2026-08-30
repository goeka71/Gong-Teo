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
admin.site.register(Program)
admin.site.register(Review)
admin.site.register(Favorite)
admin.site.register(SubFacilityDetail)