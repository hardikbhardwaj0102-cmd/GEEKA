
from django.urls import path

from apps.orders.views import (
    CheckoutView,
    CancelOrderView,
    OrderHistoryView,
    OrderDetailView,
)
from apps.orders.admin_api import (
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderStatusUpdateView,
    AdminOrderCancelView,
)


urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("", OrderHistoryView.as_view(), name="order-history"),
    path("<uuid:order_id>/cancel/",CancelOrderView.as_view(),name="cancel-order"),
    path("<uuid:order_id>/",OrderDetailView.as_view(),name="order-detail"),
    path("admin/",AdminOrderListView.as_view(),name="admin-order-list"),
    path("admin/<uuid:order_id>/",AdminOrderDetailView.as_view(),name="admin-order-detail"),
    path("admin/<uuid:order_id>/status/",AdminOrderStatusUpdateView.as_view(),name="admin-order-status-update"),
    path("admin/<uuid:order_id>/cancel/",AdminOrderCancelView.as_view(),name="admin-order-cancel"),
]
