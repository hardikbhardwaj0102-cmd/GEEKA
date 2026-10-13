
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.cart.models import Cart, CartItem
from apps.cart.services import clear_cart
from apps.catalog.models import ProductVariant
from apps.orders.models import Order, OrderItem
from apps.orders.utils import generate_order_number


@transaction.atomic
def create_order_from_cart(
    *,
    customer,
    cart,
    checkout_data,
    idempotency_key=None,
):
    """
    Create an order from an authenticated customer's cart.

    Returns:
        (order, created)
        created is False when an existing order is returned for an
        idempotent retry.
    """

    # 1. Authentication and cart ownership
    if customer is None or not customer.is_authenticated:
        raise ValidationError(
            {"detail": "Login is required to place an order."}
        )

    if cart.user_id != customer.pk or cart.guest_token is not None:
        raise ValidationError(
            {
                "detail": (
                    "You can only check out with your own account cart."
                )
            }
        )

    # Missing or empty idempotency keys must not collide with one another.
    if idempotency_key is not None:
        idempotency_key = idempotency_key.strip() or None

    idempotency_scope = f"user:{customer.pk}"

    # 2. Return the original order for a repeated submission.
    if idempotency_key:
        existing_order = Order.objects.filter(
            idempotency_scope=idempotency_scope,
            idempotency_key=idempotency_key,
        ).first()

        if existing_order:
            return existing_order, False

    # 3. Lock and re-fetch the account cart.
    locked_cart = (
        Cart.objects.select_for_update()
        .filter(pk=cart.pk, user=customer, guest_token__isnull=True)
        .first()
    )

    if locked_cart is None:
        raise ValidationError(
            {"detail": "The account cart could not be found."}
        )

    # Lock cart items so their quantities cannot change during checkout.
    cart_items = list(
        CartItem.objects.select_for_update()
        .filter(cart=locked_cart)
        .order_by("pk")
    )

    if not cart_items:
        raise ValidationError(
            {"detail": "Your cart is empty."}
        )

    # 4. Lock variants in a consistent order to reduce deadlock risk.
    variant_ids = sorted(
        {item.product_variant_id for item in cart_items},
        key=str,
    )

    variants = list(
        ProductVariant.objects.select_for_update()
        .filter(pk__in=variant_ids)
        .select_related("product", "product__category")
        .order_by("pk")
    )

    variants_by_id = {variant.pk: variant for variant in variants}

    if len(variants_by_id) != len(variant_ids):
        raise ValidationError(
            {"detail": "One or more cart products are no longer available."}
        )

    # 5. Revalidate products and calculate all prices server-side.
    subtotal = Decimal("0.00")
    currency = None
    prepared_items = []

    for cart_item in cart_items:
        variant = variants_by_id[cart_item.product_variant_id]
        product = variant.product
        category = product.category
        quantity = cart_item.quantity

        if quantity < 1:
            raise ValidationError(
                {"detail": "Cart quantities must be at least one."}
            )

        if (
            product.status != product.Status.PUBLISHED
            or not category.is_active
            or not variant.is_active
        ):
            raise ValidationError(
                {
                    "detail": (
                        f'"{product.name}" is no longer available for purchase.'
                    )
                }
            )

        if variant.stock < quantity:
            raise ValidationError(
                {
                    "detail": (
                        f'Insufficient stock for "{product.name}". '
                        f"Available: {variant.stock}; requested: {quantity}."
                    )
                }
            )

        if currency is None:
            currency = variant.currency
        elif currency != variant.currency:
            raise ValidationError(
                {
                    "detail": (
                        "Products with different currencies cannot be "
                        "placed in the same order."
                    )
                }
            )

        unit_price = variant.price
        line_total = unit_price * quantity
        subtotal += line_total

        # Snapshot variant attributes so later catalog edits do not
        # change the details recorded on the order.
        attribute_values = (
            variant.attribute_values
            .select_related("attribute")
            .order_by("attribute__name", "value")
        )

        variant_details = {
            attribute_value.attribute.name: attribute_value.value
            for attribute_value in attribute_values
        }

        prepared_items.append(
            {
                "variant": variant,
                "product_name": product.name,
                "sku": variant.sku,
                "variant_details": variant_details,
                "unit_price": unit_price,
                "quantity": quantity,
                "line_total": line_total,
                "currency": variant.currency,
            }
        )

    # Shipping and discounts are not yet implemented.
    shipping_fee = Decimal("0.00")
    discount_amount = Decimal("0.00")
    total = subtotal + shipping_fee - discount_amount

    # 6. Validate and snapshot checkout contact/address details.
    required_fields = (
        "contact_name",
        "contact_email",
        "contact_phone",
        "recipient_name",
        "delivery_phone",
        "address_line1",
        "city",
        "state",
        "postal_code",
    )

    missing_fields = [
        field
        for field in required_fields
        if not checkout_data.get(field)
    ]

    if missing_fields:
        raise ValidationError(
            {
                field: "This field is required."
                for field in missing_fields
            }
        )

    # 7. Create the order and immutable item snapshots.
    order = Order.objects.create(
        order_number=generate_order_number(),
        customer=customer,
        contact_name=checkout_data["contact_name"],
        contact_email=checkout_data["contact_email"],
        contact_phone=checkout_data["contact_phone"],
        recipient_name=checkout_data["recipient_name"],
        delivery_phone=checkout_data["delivery_phone"],
        address_line1=checkout_data["address_line1"],
        address_line2=checkout_data.get("address_line2", ""),
        city=checkout_data["city"],
        state=checkout_data["state"],
        postal_code=checkout_data["postal_code"],
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        discount_amount=discount_amount,
        total=total,
        currency=currency or "INR",
        status=Order.Status.PENDING,
        payment_status=Order.PaymentStatus.PENDING,
        idempotency_key=idempotency_key,
        idempotency_scope=idempotency_scope,
    )

    for item_data in prepared_items:
        variant = item_data["variant"]

        OrderItem.objects.create(
            order=order,
            product_variant=variant,
            product_name=item_data["product_name"],
            sku=item_data["sku"],
            variant_details=item_data["variant_details"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            line_total=item_data["line_total"],
            currency=item_data["currency"],
        )

        # Deduct stock within the same database transaction.
        variant.stock -= item_data["quantity"]
        variant.save(update_fields=["stock", "updated_at"])

    # 8. Clear the account cart only after order creation succeeds.
    clear_cart(cart=locked_cart)

    return order, True
