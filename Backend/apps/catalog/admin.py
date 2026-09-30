from django.contrib import admin
from .models import Category, Product, ProductImage, Attribute, AttributeValue, ProductVariant

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")



@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "category")
    search_fields = ("name", "slug")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "display_order",
        "is_primary",
        "is_active",
        "created_at",
    )
    list_filter = (
        "is_primary",
        "is_active",
    )
    search_fields = (
        "product__name",
        "image",
    )
    ordering = (
        "product",
        "display_order",
    )
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )


admin.site.register(Attribute)
admin.site.register(AttributeValue)
admin.site.register(ProductVariant)