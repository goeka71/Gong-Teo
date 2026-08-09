from django.contrib import admin
from .models import User, CoinHistory

admin.site.register(User)
admin.site.register(CoinHistory)