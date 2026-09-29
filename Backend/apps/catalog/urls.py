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
    AdminAttributeListCreateView,
    AdminAttributeValueListCreateView,
    AdminProductVariantListCreateView,
    AdminProductVariantDetailView,
    AdminProductVariantDeactivateView,
    AdminProductImageDetailView,
)


urlpatterns = [
    path("admin/products/<uuid:product_id>/images/",AdminProductImageUploadView.as_view(),name="admin-product-image-upload"),
    path(
        "admin/images/<uuid:image_id>/",
        AdminProductImageDetailView.as_view(),
        name="admin-product-image-detail",
    ),
    path("products/",PublicProductListView.as_view(),name="public-product-list"),
    path("products/<uuid:product_id>/",PublicProductDetailView.as_view(),name="public-product-detail"),
    path("admin/categories/",AdminCategoryListCreateView.as_view(),name="admin-category-list-create"),
    path("admin/categories/<int:category_id>/",AdminCategoryDetailView.as_view(),name="admin-category-detail"),
    path("admin/products/",AdminProductListCreateView.as_view(),name="admin-product-list-create"),
    path("admin/products/<uuid:product_id>/",AdminProductDetailView.as_view(),name="admin-product-detail"),
    path("admin/products/<uuid:product_id>/status/",AdminProductStatusView.as_view(),name="admin-product-status"),
    path(
        "admin/attributes/",
        AdminAttributeListCreateView.as_view(),
        name="admin-attribute-list-create",
    ),
    path(
        "admin/attributes/<int:attribute_id>/values/",
        AdminAttributeValueListCreateView.as_view(),
        name="admin-attribute-value-list-create",
    ),
    path(
        "admin/products/<uuid:product_id>/variants/",
        AdminProductVariantListCreateView.as_view(),
        name="admin-product-variant-list-create",
    ),
    path(
        "admin/variants/<uuid:variant_id>/",
        AdminProductVariantDetailView.as_view(),
        name="admin-product-variant-detail",
    ),
    path(
        "admin/variants/<uuid:variant_id>/deactivate/",
        AdminProductVariantDeactivateView.as_view(),
        name="admin-product-variant-deactivate",
    ),
]