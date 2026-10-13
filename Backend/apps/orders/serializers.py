
import re

from rest_framework import serializers

from apps.addresses.models import Address


class CheckoutAddressInputSerializer(serializers.Serializer):
    recipient_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default="",
    )
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=6)

    def validate_phone_number(self, value):
        value = value.strip()

        if not re.fullmatch(r"[0-9]{10,15}", value):
            raise serializers.ValidationError(
                "Enter a valid phone number containing 10 to 15 digits."
            )

        return value

    def validate_postal_code(self, value):
        value = value.strip()

        if not re.fullmatch(r"[1-9][0-9]{5}", value):
            raise serializers.ValidationError(
                "Enter a valid 6-digit Indian PIN code."
            )

        return value


class CheckoutSerializer(serializers.Serializer):
    contact_name = serializers.CharField(max_length=150)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=15)

    saved_address_id = serializers.UUIDField(required=False)
    delivery_address = CheckoutAddressInputSerializer(required=False)

    def validate_contact_phone(self, value):
        value = value.strip()

        if not re.fullmatch(r"[0-9]{10,15}", value):
            raise serializers.ValidationError(
                "Enter a valid phone number containing 10 to 15 digits."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        saved_address_id = attrs.get("saved_address_id")
        delivery_address = attrs.get("delivery_address")

        if (saved_address_id is None) == (delivery_address is None):
            raise serializers.ValidationError(
                {
                    "detail": (
                        "Provide exactly one of saved_address_id "
                        "or delivery_address."
                    )
                }
            )

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                {"detail": "Login is required to place an order."}
            )

        if saved_address_id is not None:
            address_exists = Address.objects.filter(
                pk=saved_address_id,
                user=request.user,
            ).exists()

            if not address_exists:
                raise serializers.ValidationError(
                    {
                        "saved_address_id": (
                            "The selected address does not exist "
                            "or does not belong to your account."
                        )
                    }
                )

        return attrs
