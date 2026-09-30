import secrets
from django.db import transaction
from .models import Cart
from django.core.exceptions import ValidationError
from apps.catalog.models import ProductVariant
from .models import CartItem
from decimal import Decimal

GUEST_CART_COOKIE = "geeka_guest_cart"


def generate_guest_token():
    """
    Generate a cryptographically secure opaque token
    for identifying a guest cart.
    """
    return secrets.token_urlsafe(48)


@transaction.atomic
def get_or_create_cart(*, user=None, guest_token=None):
    """
    Return the current cart for either an authenticated user
    or a guest customer.

    Exactly one of user or guest_token must be provided.
    """

    if user is not None and guest_token is not None:
        raise ValueError("Provide either user or guest_token, not both.")

    if user is None and not guest_token:
        raise ValueError("Either user or guest_token is required.")

    if user is not None:
        cart, created = Cart.objects.get_or_create(
            user=user,
            defaults={"guest_token": None},
        )
        return cart, created

    cart = Cart.objects.filter(guest_token=guest_token).first()

    if cart:
        return cart, False

    cart = Cart.objects.create(
        guest_token=guest_token,
    )

    return cart, True


def get_or_create_guest_cart():
    """
    Generate a guest token and create a guest cart.

    This helper is used when a guest customer does not
    already have a cart token.
    """

    guest_token = generate_guest_token()

    cart = Cart.objects.create(
        guest_token=guest_token,
    )

    return cart, guest_token




@transaction.atomic
def add_item_to_cart(*, cart, variant_id, quantity):
    """
    Add a product variant to the cart.

    If the variant already exists in the cart, its quantity
    is increased instead of creating a duplicate item.
    """

    try:
        variant = (
            ProductVariant.objects
            .select_related("product")
            .get(id=variant_id)
        )
    except ProductVariant.DoesNotExist:
        raise ValidationError("Product variant does not exist.")

    if not variant.is_active:
        raise ValidationError("This product variant is not available.")

    if variant.product.status != "PUBLISHED":
        raise ValidationError("This product is not available.")

    if variant.stock <= 0:
        raise ValidationError("This product variant is out of stock.")

    cart_item = (
        CartItem.objects
        .select_for_update()
        .filter(
            cart=cart,
            product_variant=variant,
        )
        .first()
    )

    if cart_item:
        new_quantity = cart_item.quantity + quantity

        if new_quantity > variant.stock:
            raise ValidationError(
                f"Only {variant.stock} item(s) are currently available."
            )

        cart_item.quantity = new_quantity
        cart_item.save(update_fields=["quantity", "updated_at"])

        return cart_item

    if quantity > variant.stock:
        raise ValidationError(
            f"Only {variant.stock} item(s) are currently available."
        )

    return CartItem.objects.create(
        cart=cart,
        product_variant=variant,
        quantity=quantity,
    )




@transaction.atomic
def update_cart_item_quantity(*, cart, cart_item_id, quantity):
    try:
        cart_item = (
            CartItem.objects
            .select_for_update()
            .select_related("product_variant__product")
            .get(
                id=cart_item_id,
                cart=cart,
            )
        )
    except CartItem.DoesNotExist:
        raise ValidationError("Cart item does not exist.")

    variant = cart_item.product_variant

    if not variant.is_active:
        raise ValidationError(
            "This product variant is not available."
        )

    if variant.product.status != "PUBLISHED":
        raise ValidationError(
            "This product is not available."
        )

    if variant.stock <= 0:
        raise ValidationError(
            "This product variant is out of stock."
        )

    if quantity > variant.stock:
        raise ValidationError(
            f"Only {variant.stock} item(s) are currently available."
        )

    cart_item.quantity = quantity
    cart_item.save(
        update_fields=["quantity", "updated_at"]
    )

    return cart_item




@transaction.atomic
def remove_cart_item(*, cart, cart_item_id):
    try:
        cart_item = (
            CartItem.objects
            .select_for_update()
            .get(
                id=cart_item_id,
                cart=cart,
            )
        )
    except CartItem.DoesNotExist:
        raise ValidationError("Cart item does not exist.")

    cart_item.delete()



@transaction.atomic
def clear_cart(*, cart):
    cart.items.all().delete()


def calculate_cart_totals(*, cart):
    items = (
        cart.items
        .select_related("product_variant")
        .all()
    )

    subtotal = Decimal("0.00")

    for item in items:
        subtotal += item.product_variant.price * item.quantity

    return {
        "subtotal": subtotal,
        "total": subtotal,
    }