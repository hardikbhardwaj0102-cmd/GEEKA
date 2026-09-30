from rest_framework import serializers
from .services import calculate_cart_totals
from .models import Cart, CartItem



class CartItemSerializer(serializers.ModelSerializer):
    in_stock = serializers.SerializerMethodField()
    is_purchasable = serializers.SerializerMethodField()

    product_id = serializers.UUIDField(
        source="product_variant.product.id",
        read_only=True,
    )
    variant_id = serializers.UUIDField(
        source="product_variant.id",
        read_only=True,
    )
    product_name = serializers.CharField(
        source="product_variant.product.name",
        read_only=True,
    )
    sku = serializers.CharField(
        source="product_variant.sku",
        read_only=True,
    )
    price = serializers.DecimalField(
        source="product_variant.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    stock = serializers.IntegerField(
        source="product_variant.stock",
        read_only=True,
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_id",
            "variant_id",
            "product_name",
            "sku",
            "price",
            "quantity",
            "subtotal",
            "stock",
            "in_stock",
            "is_purchasable",
        ]

    def get_subtotal(self, obj):
        return f"{obj.product_variant.price * obj.quantity:.2f}"
    def get_in_stock(self, obj):
        return obj.product_variant.stock > 0

    def get_is_purchasable(self, obj):
        variant = obj.product_variant

        return (
            variant.is_active
            and variant.product.status == "PUBLISHED"
            and variant.stock >= obj.quantity
        )



class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "subtotal",
            "total",
            "created_at",
            "updated_at",
        ]

    def _get_totals(self, obj):
        if not hasattr(self, "_cart_totals"):
            self._cart_totals = calculate_cart_totals(
                cart=obj,
            )

        return self._cart_totals

    def get_subtotal(self, obj):
        return f"{self._get_totals(obj)['subtotal']:.2f}"

    def get_total(self, obj):
        return f"{self._get_totals(obj)['total']:.2f}"



class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

