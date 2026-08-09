from django.contrib import admin
from .models import MyProgram, OnedayPost, OnedayApplication

admin.site.register(MyProgram)
admin.site.register(OnedayPost)
admin.site.register(OnedayApplication)