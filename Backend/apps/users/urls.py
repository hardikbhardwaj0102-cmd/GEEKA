
from django.urls import path

from .admin_api import (
    AdminCustomerListView,
    AdminCustomerDetailView,
    AdminCustomerStatusUpdateView,
    AdminCustomerOrdersView,
)

urlpatterns = [
    path(
        "admin/customers/",
        AdminCustomerListView.as_view(),
        name="admin-customer-list",
    ),
    path(
        "admin/customers/<uuid:customer_id>/",
        AdminCustomerDetailView.as_view(),
        name="admin-customer-detail",
    ),
    path(
        "admin/customers/<uuid:customer_id>/status/",
        AdminCustomerStatusUpdateView.as_view(),
        name="admin-customer-status-update",
    ),
    path(
    "admin/customers/<uuid:customer_id>/orders/",
    AdminCustomerOrdersView.as_view(),
    name="admin-customer-orders",
    ),
]
