from rest_framework import serializers

from .models import ProductImage


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