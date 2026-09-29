from rest_framework import serializers

from .models import (
    Attribute,
    AttributeValue,
    Category,
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
    images = serializers.SerializerMethodField()
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

    def get_images(self, obj):
        images = (
            obj.images
            .filter(is_active=True)
            .order_by("display_order", "created_at")
        )

        return PublicProductImageSerializer(
            images,
            many=True,
            context=self.context,
        ).data

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



class AdminCategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        required=False,
        allow_blank=True,
        )
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Category name must contain at least 2 characters."
            )

        return value


class AdminProductSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )

    category = serializers.SerializerMethodField(read_only=True)

    slug = serializers.SlugField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category_id",
            "category",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Product name must contain at least 2 characters."
            )

        return value

    def validate_slug(self, value):
        return value.strip()

    def get_category(self, obj):
        return {
            "id": obj.category.id,
            "name": obj.category.name,
            "slug": obj.category.slug,
        }



class AdminAttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = [
            "id",
            "value",
        ]

    def validate_value(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Attribute value cannot be empty."
            )

        return value


class AdminAttributeSerializer(serializers.ModelSerializer):
    values = AdminAttributeValueSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Attribute
        fields = [
            "id",
            "name",
            "values",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Attribute name cannot be empty."
            )

        return value




class AdminProductVariantSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(
        source="product.id",
        read_only=True,
    )

    attribute_value_ids = serializers.PrimaryKeyRelatedField(
        source="attribute_values",
        queryset=AttributeValue.objects.select_related("attribute"),
        many=True,
        write_only=True,
        required=False,
    )

    attributes = serializers.SerializerMethodField(read_only=True)
    currency = serializers.CharField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product_id",
            "sku",
            "attribute_value_ids",
            "attributes",
            "price",
            "currency",
            "stock",
            "low_stock_threshold",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "product_id",
            "currency",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero."
            )

        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Low-stock threshold cannot be negative."
            )

        return value


    def validate(self, attrs):
        product = self.instance.product if self.instance else self.context.get("product")

        attribute_values = attrs.get(
            "attribute_values",
            self.instance.attribute_values.all()
            if self.instance
            else AttributeValue.objects.none(),
        )

        attribute_values = list(attribute_values)

        # A variant cannot contain multiple values from the same attribute.
        attribute_ids = [
            attribute_value.attribute_id
            for attribute_value in attribute_values
        ]

        if len(attribute_ids) != len(set(attribute_ids)):
            raise serializers.ValidationError(
                {
                    "attribute_value_ids": [
                        "A variant cannot contain multiple values from the same attribute."
                    ]
                }
            )
        # Default/no-option variant rules.
        existing_variants = ProductVariant.objects.filter(
            product=product,
        )

        if self.instance:
            existing_variants = existing_variants.exclude(
                pk=self.instance.pk
            )

        existing_default_exists = any(
            not variant.attribute_values.exists()
            for variant in existing_variants
        )

        existing_option_variant_exists = any(
            variant.attribute_values.exists()
            for variant in existing_variants
        )

        if not attribute_values:
            # A product cannot mix a default variant with option-based variants.
            if existing_option_variant_exists:
                raise serializers.ValidationError(
                    {
                        "attribute_value_ids": [
                            "A product cannot mix a default/no-option variant with attribute-based variants."
                        ]
                    }
                )

            # Only one default/no-option variant is allowed.
            if existing_default_exists:
                raise serializers.ValidationError(
                    {
                        "attribute_value_ids": [
                            "This product already has a default/no-option variant."
                        ]
                    }
                )

        else:
            # Option-based variants cannot be mixed with a default variant.
            if existing_default_exists:
                raise serializers.ValidationError(
                    {
                        "attribute_value_ids": [
                            "A product cannot mix a default/no-option variant with attribute-based variants."
                        ]
                    }
                )
        # Check duplicate attribute combination.
        if attribute_values:
            selected_ids = sorted(
                attribute_value.id
                for attribute_value in attribute_values
            )

            existing_variants = ProductVariant.objects.filter(
                product=product,
            ).prefetch_related("attribute_values")

            if self.instance:
                existing_variants = existing_variants.exclude(
                    pk=self.instance.pk
                )

            for variant in existing_variants:
                existing_ids = sorted(
                    attribute_value.id
                    for attribute_value in variant.attribute_values.all()
                )

                if existing_ids == selected_ids:
                    raise serializers.ValidationError(
                        {
                            "attribute_value_ids": [
                                "A variant with the same attribute combination already exists for this product."
                            ]
                        }
                    )

        return attrs

    def get_attributes(self, obj):
        return [
            {
                "attribute": {
                    "id": attribute_value.attribute.id,
                    "name": attribute_value.attribute.name,
                },
                "value": {
                    "id": attribute_value.id,
                    "value": attribute_value.value,
                },
            }
            for attribute_value in obj.attribute_values.select_related(
                "attribute"
            ).all()
        ]