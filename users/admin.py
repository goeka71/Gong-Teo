from django.contrib import admin
from .models import User, CoinHistory, PasswordResetCode

admin.site.register(User)
admin.site.register(CoinHistory)
admin.site.register(PasswordResetCode)