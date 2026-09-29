from rest_framework import serializers

from .models import (
    Product,
    ProductImage,
    ProductVariant,
)


class ProductImageUploadSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True)

    class Meta:
        model = ProductImage
        fields = [
            "image_file",
            "display_order",
            "is_primary",
        ]

    def validate_image_file(self, value):
        from .validators import validate_product_image

        validate_product_image(value)
        return value



class PublicProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image_url",
            "display_order",
            "is_primary",
        ]

    def get_image_url(self, obj):
        from .supabase_storage import create_product_image_signed_url

        return create_product_image_signed_url(obj.image)


class PublicProductVariantSerializer(serializers.ModelSerializer):
    attributes = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "attributes",
            "price",
            "currency",
            "stock",
            "in_stock",
            "is_low_stock",
            "is_active",
        ]

    def get_attributes(self, obj):
        return [
            {
                "attribute": attribute_value.attribute.name,
                "value": attribute_value.value,
            }
            for attribute_value in obj.attribute_values.all()
        ]

    def get_in_stock(self, obj):
        return obj.is_active and obj.stock > 0

    def get_is_low_stock(self, obj):
        if not obj.is_active or obj.stock <= 0:
            return False

        if obj.low_stock_threshold <= 0:
            return False

        return obj.stock <= obj.low_stock_threshold


class PublicProductListSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "primary_image",
        ]

    def get_category(self, obj):
        return {
            "id": obj.category.id,
            "name": obj.category.name,
            "slug": obj.category.slug,
        }

    def get_primary_image(self, obj):
        image = (
            obj.images
            .filter(is_active=True, is_primary=True)
            .first()
        )

        if not image:
            return None

        from .supabase_storage import create_product_image_signed_url

        return {
            "id": str(image.id),
            "image_url": create_product_image_signed_url(image.image),
            "display_order": image.display_order,
            "is_primary": image.is_primary,
        }


class PublicProductDetailSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    images = PublicProductImageSerializer(
        many=True,
        read_only=True,
    )
    variants = serializers.SerializerMethodField()
    is_purchasable = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "images",
            "variants",
            "is_purchasable",
        ]

    def get_category(self, obj):
        return {
            "id": obj.category.id,
            "name": obj.category.name,
            "slug": obj.category.slug,
        }

    def get_variants(self, obj):
        variants = (
            obj.variants
            .filter(is_active=True)
            .prefetch_related(
                "attribute_values__attribute"
            )
        )

        return PublicProductVariantSerializer(
            variants,
            many=True,
            context=self.context,
        ).data

    def get_is_purchasable(self, obj):
        return obj.variants.filter(
            is_active=True,
            stock__gt=0,
        ).exists()