
from django.urls import path
from apps.orders.views import CheckoutView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
]
