from django.core.exceptions import ValidationError

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Wishlist, WishlistItem
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    CartItemSerializer,
    UpdateCartItemSerializer,
)

from .services import (
    GUEST_CART_COOKIE,
    generate_guest_token,
    get_or_create_cart,
    add_item_to_cart,
    update_cart_item_quantity,
    remove_cart_item,
    clear_cart,
)
from rest_framework.permissions import IsAuthenticated
from apps.catalog.models import Product
from apps.cart.services import (
    get_or_create_wishlist,
    add_product_to_wishlist,
    remove_product_from_wishlist,
    clear_wishlist,
)
from apps.cart.serializers import (
    WishlistSerializer,
    WishlistItemSerializer,
    AddWishlistItemSerializer,
)



class CartDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            cart, _ = get_or_create_cart(
                user=request.user,
            )

            response = Response(
                CartSerializer(cart).data,
            )

            return response

        guest_token = request.COOKIES.get(GUEST_CART_COOKIE)

        if not guest_token:
            guest_token = generate_guest_token()

        cart, _ = get_or_create_cart(
            guest_token=guest_token,
        )

        response = Response(
            CartSerializer(cart).data,
        )

        if not request.COOKIES.get(GUEST_CART_COOKIE):
            response.set_cookie(
                GUEST_CART_COOKIE,
                guest_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                max_age=60 * 60 * 24 * 365,
            )

        return response

    def delete(self, request):
        if request.user.is_authenticated:
            cart, _ = get_or_create_cart(
                user=request.user,
            )
        else:
            guest_token = request.COOKIES.get(
                GUEST_CART_COOKIE
            )

            if not guest_token:
                return Response(
                    status=status.HTTP_204_NO_CONTENT,
                )

            cart, _ = get_or_create_cart(
                guest_token=guest_token,
            )

        clear_cart(cart=cart)

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )


class CartItemCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if request.user.is_authenticated:
            cart, _ = get_or_create_cart(
                user=request.user,
            )
            guest_token = None
        else:
            guest_token = request.COOKIES.get(GUEST_CART_COOKIE)

            if not guest_token:
                guest_token = generate_guest_token()

            cart, _ = get_or_create_cart(
                guest_token=guest_token,
            )

        try:
            cart_item = add_item_to_cart(
                cart=cart,
                variant_id=serializer.validated_data["variant_id"],
                quantity=serializer.validated_data["quantity"],
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = Response(
            CartItemSerializer(cart_item).data,
            status=status.HTTP_201_CREATED,
        )

        if (
            not request.user.is_authenticated
            and not request.COOKIES.get(GUEST_CART_COOKIE)
        ):
            response.set_cookie(
                GUEST_CART_COOKIE,
                guest_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                max_age=60 * 60 * 24 * 365,
            )

        return response



class CartItemUpdateView(APIView):
    permission_classes = [AllowAny]

    def _get_cart(self, request):
        if request.user.is_authenticated:
            cart, _ = get_or_create_cart(
                user=request.user,
            )
            return cart

        guest_token = request.COOKIES.get(
            GUEST_CART_COOKIE
        )

        if not guest_token:
            return None

        cart, _ = get_or_create_cart(
            guest_token=guest_token,
        )

        return cart

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)

        cart = self._get_cart(request)

        if cart is None:
            return Response(
                {"detail": "Cart does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            cart_item = update_cart_item_quantity(
                cart=cart,
                cart_item_id=item_id,
                quantity=serializer.validated_data["quantity"],
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            CartItemSerializer(cart_item).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, item_id):
        cart = self._get_cart(request)

        if cart is None:
            return Response(
                {"detail": "Cart item does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            remove_cart_item(
                cart=cart,
                cart_item_id=item_id,
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )



class WishlistDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist = get_or_create_wishlist(request.user)

        wishlist = (
            Wishlist.objects
            .prefetch_related(
                "items__product__category"
            )
            .get(id=wishlist.id)
        )

        return Response(
            WishlistSerializer(wishlist).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        clear_wishlist(user=request.user)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class WishlistItemCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddWishlistItemSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]

        product = (
            Product.objects
            .select_related("category")
            .filter(
                id=product_id,
                status=Product.Status.PUBLISHED,
            )
            .first()
        )

        if product is None:
            return Response(
                {
                    "detail": "Product does not exist or is not available."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        item, created = add_product_to_wishlist(
            user=request.user,
            product=product,
        )

        response_status = (
            status.HTTP_201_CREATED
            if created
            else status.HTTP_200_OK
        )

        return Response(
            WishlistItemSerializer(item).data,
            status=response_status,
        )


class WishlistItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        wishlist = get_or_create_wishlist(request.user)

        item = (
            WishlistItem.objects
            .filter(
                id=item_id,
                wishlist=wishlist,
            )
            .first()
        )

        if item is None:
            return Response(
                {
                    "detail": "Wishlist item does not exist."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        remove_product_from_wishlist(
            user=request.user,
            product=item.product,
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )