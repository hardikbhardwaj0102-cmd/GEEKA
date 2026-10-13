from django.urls import path

from .views import (
    CartDetailView,
    CartItemCreateView,
    CartItemUpdateView,
    WishlistDetailView,
    WishlistItemCreateView,
    WishlistItemDeleteView,
)


urlpatterns = [
    path("",CartDetailView.as_view(),name="cart-detail"),
    path("items/",CartItemCreateView.as_view(),name="cart-item-create"),
    path("items/<uuid:item_id>/",CartItemUpdateView.as_view(),name="cart-item"),
    path("wishlist/", WishlistDetailView.as_view(), name="wishlist-detail"),
    path("wishlist/items/",WishlistItemCreateView.as_view(),name="wishlist-item-create",),
    path("wishlist/items/<uuid:item_id>/",WishlistItemDeleteView.as_view(),name="wishlist-item-delete",),
]