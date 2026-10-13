
from django.urls import path

from apps.orders.views import CheckoutView, CancelOrderView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("<uuid:order_id>/cancel/",CancelOrderView.as_view(),name="cancel-order",),
]
