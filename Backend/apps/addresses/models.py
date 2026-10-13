import uuid

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models


class Address(models.Model):
    class Label(models.TextChoices):
        HOME = "HOME", "Home"
        WORK = "WORK", "Work"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    label = models.CharField(
        max_length=10,
        choices=Label.choices,
        default=Label.HOME,
    )

    recipient_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=15)

    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)

    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)

    postal_code = models.CharField(
        max_length=6,
        validators=[
            RegexValidator(
                regex=r"^[1-9][0-9]{5}$",
                message="Enter a valid 6-digit Indian PIN code.",
            )
        ],
    )

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]

    def __str__(self):
        return f"{self.recipient_name} - {self.city} ({self.label})"