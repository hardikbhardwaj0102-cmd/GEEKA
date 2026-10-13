from .models import Order, OrderItem
from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from .services import transition_order_status


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "contact_email",
        "status",
        "payment_status",
        "total",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_status",
        "created_at",
    )

    search_fields = (
        "order_number",
        "contact_email",
        "contact_name",
    )

    readonly_fields = (
        "id",
        "order_number",
        "customer",
        "subtotal",
        "shipping_fee",
        "discount_amount",
        "total",
        "currency",
        "status",
        "payment_status",
        "idempotency_key",
        "idempotency_scope",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)

    actions = ["advance_order_status"]

    @admin.action(description="Advance selected orders to the next status")
    def advance_order_status(self, request, queryset):
        transitions = {
            Order.Status.PENDING: Order.Status.CONFIRMED,
            Order.Status.CONFIRMED: Order.Status.PROCESSING,
            Order.Status.PROCESSING: Order.Status.SHIPPED,
            Order.Status.SHIPPED: Order.Status.DELIVERED,
        }

        succeeded = 0
        failed = 0

        for selected_order in queryset:
            next_status = transitions.get(selected_order.status)

            if next_status is None:
                failed += 1
                continue

            try:
                transition_order_status(
                    order_id=selected_order.pk,
                    new_status=next_status,
                )
                succeeded += 1
            except ValidationError:
                failed += 1

        if succeeded:
            self.message_user(
                request,
                f"{succeeded} order(s) advanced successfully.",
                level=messages.SUCCESS,
            )

        if failed:
            self.message_user(
                request,
                f"{failed} order(s) could not be advanced.",
                level=messages.WARNING,
            )



@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order",)
    readonly_fields = tuple(
        field.name for field in OrderItem._meta.fields
    )
