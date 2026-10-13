
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.addresses.models import Address
from apps.cart.models import Cart
from apps.orders.models import Order
from apps.orders.serializers import CheckoutSerializer
from apps.orders.services import (
    create_order_from_cart,
    cancel_order,
)

def build_order_response(order):
    """Build a checkout response from persisted order snapshots."""

    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "contact": {
            "name": order.contact_name,
            "email": order.contact_email,
            "phone": order.contact_phone,
        },
        "delivery_address": {
            "recipient_name": order.recipient_name,
            "phone_number": order.delivery_phone,
            "address_line1": order.address_line1,
            "address_line2": order.address_line2,
            "city": order.city,
            "state": order.state,
            "postal_code": order.postal_code,
        },
        "items": [
            {
                "id": str(item.id),
                "product_name": item.product_name,
                "sku": item.sku,
                "variant_details": item.variant_details,
                "unit_price": str(item.unit_price),
                "quantity": item.quantity,
                "line_total": str(item.line_total),
                "currency": item.currency,
            }
            for item in order.items.all()
        ],
        "subtotal": str(order.subtotal),
        "shipping_fee": str(order.shipping_fee),
        "discount_amount": str(order.discount_amount),
        "total": str(order.total),
        "currency": order.currency,
        "created_at": order.created_at.isoformat(),
    }


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Validate contact details and the selected delivery address.
        serializer = CheckoutSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        checkout_data = dict(serializer.validated_data)

        # 2. Resolve the customer's own account cart.
        cart = Cart.objects.filter(
            user=request.user,
            guest_token__isnull=True,
        ).first()

        if cart is None:
            raise DRFValidationError(
                {"detail": "Your account cart is empty."}
            )

        # 3. Resolve a saved address or use the validated new address.
        saved_address_id = checkout_data.pop("saved_address_id", None)
        delivery_address = checkout_data.pop("delivery_address", None)

        if saved_address_id is not None:
            address = Address.objects.filter(
                pk=saved_address_id,
                user=request.user,
            ).first()

            if address is None:
                raise DRFValidationError(
                    {
                        "saved_address_id": (
                            "The selected address does not exist "
                            "or does not belong to your account."
                        )
                    }
                )

            checkout_data.update(
                {
                    "recipient_name": address.recipient_name,
                    "delivery_phone": address.phone_number,
                    "address_line1": address.address_line1,
                    "address_line2": address.address_line2,
                    "city": address.city,
                    "state": address.state,
                    "postal_code": address.postal_code,
                }
            )

        elif delivery_address is not None:
            checkout_data.update(
                {
                    "recipient_name": delivery_address["recipient_name"],
                    "delivery_phone": delivery_address["phone_number"],
                    "address_line1": delivery_address["address_line1"],
                    "address_line2": delivery_address.get(
                        "address_line2", ""
                    ),
                    "city": delivery_address["city"],
                    "state": delivery_address["state"],
                    "postal_code": delivery_address["postal_code"],
                }
            )

        else:
            raise DRFValidationError(
                {
                    "detail": (
                        "Choose a saved address or provide a delivery address."
                    )
                }
            )

        # 4. Validate the optional idempotency header.
        idempotency_key = request.headers.get("Idempotency-Key")

        if idempotency_key is not None:
            idempotency_key = idempotency_key.strip()

            if not idempotency_key:
                idempotency_key = None
            elif len(idempotency_key) > 128:
                raise DRFValidationError(
                    {
                        "Idempotency-Key": (
                            "This header must not exceed 128 characters."
                        )
                    }
                )

        # 5. Create the order through the transactional service.
        try:
            order, created = create_order_from_cart(
                customer=request.user,
                cart=cart,
                checkout_data=checkout_data,
                idempotency_key=idempotency_key,
            )
        except DjangoValidationError as exc:
            detail = getattr(exc, "message_dict", None)

            if detail is None:
                detail = {"detail": exc.messages}

            raise DRFValidationError(detail) from exc

        # 6. Return the saved order, not client-supplied totals.
        order = Order.objects.prefetch_related("items").get(pk=order.pk)

        response_status = (
            status.HTTP_201_CREATED
            if created
            else status.HTTP_200_OK
        )

        return Response(
            {
                "message": (
                    "Order created successfully."
                    if created
                    else "This order was already created."
                ),
                "order": build_order_response(order),
            },
            status=response_status,
        )




class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = cancel_order(
                order_id=order_id,
                customer=request.user,
            )
        except DjangoValidationError as exc:
            detail = getattr(exc, "message_dict", None)

            if detail is None:
                detail = {"detail": exc.messages}

            raise DRFValidationError(detail) from exc

        return Response(
            {
                "message": "Order cancelled successfully.",
                "order": build_order_response(order),
            },
            status=status.HTTP_200_OK,
        )
