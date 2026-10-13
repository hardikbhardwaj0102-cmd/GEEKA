from rest_framework import serializers

from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "label",
            "recipient_name",
            "phone_number",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_phone_number(self, value):
        value = value.strip()

        if not value.isdigit() or not 10 <= len(value) <= 15:
            raise serializers.ValidationError(
                "Enter a valid phone number containing 10–15 digits."
            )

        return value

    def validate_postal_code(self, value):
        value = value.strip()

        if not len(value) == 6 or not value.isdigit() or value[0] == "0":
            raise serializers.ValidationError(
                "Enter a valid 6-digit Indian PIN code."
            )

        return value