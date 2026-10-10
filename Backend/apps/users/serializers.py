
from rest_framework import serializers

from apps.users.models import User


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "email_verified",
            "phone_number",
            "phone_verified",
            "date_joined",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "email_verified",
            "phone_number",
            "phone_verified",
            "date_joined",
            "updated_at",
        ]

    def validate_full_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Full name cannot be empty."
            )

        return value
