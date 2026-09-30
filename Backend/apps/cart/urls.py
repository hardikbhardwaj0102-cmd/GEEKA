from django.urls import path

from .views import (
    CartDetailView,
    CartItemCreateView,
    CartItemUpdateView,
)


urlpatterns = [
    path(
        "",
        CartDetailView.as_view(),
        name="cart-detail",
    ),
    path(
        "items/",
        CartItemCreateView.as_view(),
        name="cart-item-create",
    ),
    path(
        "items/<uuid:item_id>/",
        CartItemUpdateView.as_view(),
        name="cart-item",
    ),
]