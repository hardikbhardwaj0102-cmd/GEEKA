from django.urls import path

from .admin_api import (
    AdminCustomerListView,
    AdminCustomerDetailView,
)

urlpatterns = [
    path("admin/", AdminCustomerListView.as_view(), name="customer-admin-list"),
    path(
        "admin/<uuid:customer_id>/",
        AdminCustomerDetailView.as_view(),
        name="customer-admin-detail",
    ),
]