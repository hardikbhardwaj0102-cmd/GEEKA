from django.urls import path

from .views import AdminProductImageUploadView


urlpatterns = [
    path(
        "admin/products/<uuid:product_id>/images/",AdminProductImageUploadView.as_view(),name="admin-product-image-upload"),
]