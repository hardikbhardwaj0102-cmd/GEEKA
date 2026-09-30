import secrets
from django.db import transaction
from .models import Cart, CartItem
from django.core.exceptions import ValidationError
from apps.catalog.models import ProductVariant
from .models import CartItem
from decimal import Decimal
from apps.catalog.models import Product
from apps.cart.models import Wishlist, WishlistItem


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



@transaction.atomic
def merge_guest_cart_into_user_cart(*, user, guest_token):
    """
    Merge a guest cart into the authenticated user's cart.

    - New variants are moved into the user's cart.
    - Existing variants have their quantities combined.
    - Quantities never exceed current stock.
    - Unavailable items are preserved.
    - The guest cart is deleted after a successful merge.
    """

    if not guest_token:
        return None

    guest_cart = (
        Cart.objects
        .select_for_update()
        .filter(guest_token=guest_token)
        .first()
    )

    if guest_cart is None:
        return None

    user_cart, _ = Cart.objects.get_or_create(
        user=user,
    )

    user_cart = (
        Cart.objects
        .select_for_update()
        .get(id=user_cart.id)
    )

    guest_items = (
        CartItem.objects
        .select_related("product_variant__product")
        .select_for_update()
        .filter(cart=guest_cart)
    )

    for guest_item in guest_items:
        variant = guest_item.product_variant

        user_item = (
            CartItem.objects
            .select_for_update()
            .filter(
                cart=user_cart,
                product_variant=variant,
            )
            .first()
        )

        if user_item is None:
            quantity = guest_item.quantity

            if variant.stock > 0:
                quantity = min(quantity, variant.stock)

            CartItem.objects.create(
                cart=user_cart,
                product_variant=variant,
                quantity=quantity,
            )
            continue

        combined_quantity = (
            user_item.quantity + guest_item.quantity
        )

        if variant.stock > 0:
            combined_quantity = min(
                combined_quantity,
                variant.stock,
            )

        user_item.quantity = combined_quantity
        user_item.save(
            update_fields=["quantity", "updated_at"]
        )

    guest_cart.delete()

    return user_cart




def get_or_create_wishlist(user):
    wishlist, _ = Wishlist.objects.get_or_create(
        user=user
    )
    return wishlist


def add_product_to_wishlist(user, product):
    wishlist = get_or_create_wishlist(user)

    item, created = WishlistItem.objects.get_or_create(
        wishlist=wishlist,
        product=product,
    )

    return item, created


def remove_product_from_wishlist(user, product):
    wishlist = get_or_create_wishlist(user)

    deleted_count, _ = WishlistItem.objects.filter(
        wishlist=wishlist,
        product=product,
    ).delete()

    return deleted_count > 0


def clear_wishlist(user):
    wishlist = get_or_create_wishlist(user)

    deleted_count, _ = wishlist.items.all().delete()

    return deleted_count