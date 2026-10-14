from rest_framework import serializers

from .models import ContactMessage


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be blank.")
        return value

    def validate_subject(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Subject cannot be blank.")
        return value

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message cannot be blank.")
        return value


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "name",
            "email",
            "subject",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields



class StrictBooleanField(serializers.Field):
    default_error_messages = {
        "invalid": "Expected a JSON boolean: true or false."
    }

    def to_internal_value(self, data):
        if not isinstance(data, bool):
            self.fail("invalid")
        return data

    def to_representation(self, value):
        return bool(value)


class ContactMessageReadStatusSerializer(serializers.ModelSerializer):
    is_read = StrictBooleanField(required=True)

    class Meta:
        model = ContactMessage
        fields = ["is_read"]

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("Expected a JSON object.")

        extra_fields = set(data.keys()) - {"is_read"}
        if extra_fields:
            raise serializers.ValidationError({
                field: ["This field is not allowed."]
                for field in sorted(extra_fields)
            })

        return super().to_internal_value(data)