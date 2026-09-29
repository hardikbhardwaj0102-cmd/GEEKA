from django.urls import path

from .views import (
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    AdminProductImageUploadView,
    PublicProductListView,
    PublicProductDetailView,
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminProductStatusView,
)


urlpatterns = [
    path("admin/products/<uuid:product_id>/images/",AdminProductImageUploadView.as_view(),name="admin-product-image-upload"),
    path("products/",PublicProductListView.as_view(),name="public-product-list"),
    path("products/<uuid:product_id>/",PublicProductDetailView.as_view(),name="public-product-detail"),
    path("admin/categories/",AdminCategoryListCreateView.as_view(),name="admin-category-list-create"),
    path("admin/categories/<int:category_id>/",AdminCategoryDetailView.as_view(),name="admin-category-detail"),
    path("admin/products/",AdminProductListCreateView.as_view(),name="admin-product-list-create"),
    path("admin/products/<uuid:product_id>/",AdminProductDetailView.as_view(),name="admin-product-detail"),
    path("admin/products/<uuid:product_id>/status/",AdminProductStatusView.as_view(),name="admin-product-status"),
]