import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    order_number = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
    )

    # Null for guest checkout; set for authenticated customers.
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    # Customer/contact snapshots.
    contact_name = models.CharField(max_length=150)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)

    # Delivery address snapshot: intentionally independent of saved addresses.
    recipient_name = models.CharField(max_length=150)
    delivery_phone = models.CharField(max_length=15)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=6)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    currency = models.CharField(max_length=3, default="INR")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )


    # Used to make repeated checkout requests safe.
    idempotency_key = models.CharField(
        max_length=128,
        null=True,
        blank=True,
    )
    idempotency_scope = models.CharField(max_length=128, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="order_subtotal_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(shipping_fee__gte=0),
                name="order_shipping_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(discount_amount__gte=0),
                name="order_discount_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(total__gte=0),
                name="order_total_nonnegative",
            ),
            models.UniqueConstraint(
                fields=["idempotency_scope", "idempotency_key"],
                condition=~Q(idempotency_key__isnull=True),
                name="unique_order_idempotency_scope_key",
            ),
        ]
        indexes = [
            models.Index(fields=["customer", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["payment_status", "-created_at"]),
        ]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    # Optional link for reference; snapshots remain available if the variant
    # is later deleted.
    product_variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )

    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    variant_details = models.JSONField(default=dict, blank=True)

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )
    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    currency = models.CharField(max_length=3, default="INR")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="order_item_quantity_positive",
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="order_item_unit_price_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(line_total__gte=0),
                name="order_item_line_total_nonnegative",
            ),
        ]

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"
