
from django.urls import path

from apps.orders.views import (
    CheckoutView,
    CancelOrderView,
    OrderHistoryView,
    OrderDetailView,
)

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("", OrderHistoryView.as_view(), name="order-history"),
    path("<uuid:order_id>/cancel/",CancelOrderView.as_view(),name="cancel-order"),
    path("<uuid:order_id>/",OrderDetailView.as_view(),name="order-detail"),
]
