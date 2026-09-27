from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    ordering = ("email",)
    list_display = (
        "email",
        "full_name",
        "email_verified",
        "is_active",
        "is_staff",
    )
    search_fields = ("email", "full_name")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Information", {"fields": ("full_name",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Verification", {"fields": ("email_verified",)}),
        ("Important Dates", {"fields": ("date_joined", "last_login", "updated_at")}),
    )
    readonly_fields = ("date_joined", "last_login", "updated_at")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "password1",
                    "password2",
                    "email_verified",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )