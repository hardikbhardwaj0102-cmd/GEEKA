from django.urls import path

from .views import (
    AdminProductImageUploadView,
    PublicProductListView,
    PublicProductDetailView,
)


urlpatterns = [
    path("admin/products/<uuid:product_id>/images/",AdminProductImageUploadView.as_view(),name="admin-product-image-upload"),
    path("products/",PublicProductListView.as_view(),name="public-product-list"),
    path("products/<uuid:product_id>/",PublicProductDetailView.as_view(),name="public-product-detail"),
]