
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product, ProductVariant
from apps.orders.models import Order
from apps.orders.services import create_order_from_cart
from django.core.exceptions import ValidationError


User = get_user_model()


class OrderTests(TestCase):
    def setUp(self):
        # Create a test customer.
        self.user = User.objects.create_user(
        email="checkout-test@example.com",
        full_name="Checkout Test User",
        password="TestPassword123!",
        )

        # Create a published product that can be purchased.
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category",
            is_active=True,
        )

        self.product = Product.objects.create(
            category=self.category,
            name="Test Checkout Product",
            slug="test-checkout-product",
            status=Product.Status.PUBLISHED,
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="TEST-CHECKOUT-001",
            price=Decimal("250.00"),
            currency="INR",
            stock=10,
            is_active=True,
        )

        # Create the customer's account cart and add two units.
        self.cart = Cart.objects.create(user=self.user)

        CartItem.objects.create(
            cart=self.cart,
            product_variant=self.variant,
            quantity=2,
        )

        self.checkout_data = {
            "contact_name": "Test Customer",
            "contact_email": "checkout-test@example.com",
            "contact_phone": "9876543210",
            "recipient_name": "Test Recipient",
            "delivery_phone": "9876543210",
            "address_line1": "12 Test Street",
            "address_line2": "",
            "city": "Delhi",
            "state": "Delhi",
            "postal_code": "110009",
        }

    def test_checkout_deducts_stock_and_clears_cart(self):
        # Arrange: stock starts at 10, and cart quantity is 2.
        self.assertEqual(self.variant.stock, 10)

        # Act: create an order using the existing checkout service.
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        # Assert: the order was created successfully.
        self.assertTrue(created)
        self.assertTrue(Order.objects.filter(pk=order.pk).exists())

        # Assert: stock decreased by exactly the ordered quantity.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)

        # Assert: the order total was calculated correctly.
        self.assertEqual(order.subtotal, Decimal("500.00"))
        self.assertEqual(order.total, Decimal("500.00"))

        # Assert: payment is still pending.
        self.assertEqual(
            order.payment_status,
            Order.PaymentStatus.PENDING,
        )

        # Assert: the cart is empty after successful checkout.
        self.assertFalse(CartItem.objects.filter(cart=self.cart).exists())


    
    def test_checkout_rejects_insufficient_stock(self):
        # The variant has 10 units in stock.
        self.variant.stock = 1
        self.variant.save(update_fields=["stock"])

        # The cart requests 2 units, but only 1 is available.
        with self.assertRaises(ValidationError):
            create_order_from_cart(
                customer=self.user,
                cart=self.cart,
                checkout_data=self.checkout_data,
            )

        # Stock must remain unchanged.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 1)

        # No order should have been created.
        self.assertEqual(Order.objects.count(), 0)

        # The cart should remain available for the customer.
        self.assertTrue(
            CartItem.objects.filter(cart=self.cart).exists()
        )



    
    def test_checkout_rejects_empty_cart(self):
        # Remove all items from the test cart.
        CartItem.objects.filter(cart=self.cart).delete()

        # Checkout should reject the empty cart.
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            create_order_from_cart(
                customer=self.user,
                cart=self.cart,
                checkout_data=self.checkout_data,
            )

        # No order should be created.
        self.assertEqual(Order.objects.count(), 0)

        # Stock must remain unchanged.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)


    
    def test_repeated_idempotency_key_does_not_create_duplicate_order(self):
        first_order, first_created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
            idempotency_key="checkout-test-key-001",
        )

        second_order, second_created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
            idempotency_key="checkout-test-key-001",
        )

        self.assertTrue(first_created)
        self.assertFalse(second_created)
        self.assertEqual(first_order.pk, second_order.pk)
        self.assertEqual(Order.objects.count(), 1)

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)




    def test_checkout_rejects_unpublished_product(self):
        self.product.status = Product.Status.DRAFT
        self.product.save(update_fields=["status"])

        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            create_order_from_cart(
                customer=self.user,
                cart=self.cart,
                checkout_data=self.checkout_data,
            )

        self.assertEqual(Order.objects.count(), 0)

    def test_checkout_rejects_inactive_category(self):
        self.category.is_active = False
        self.category.save(update_fields=["is_active"])

        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            create_order_from_cart(
                customer=self.user,
                cart=self.cart,
                checkout_data=self.checkout_data,
            )

        self.assertEqual(Order.objects.count(), 0)

    def test_checkout_rejects_inactive_variant(self):
        self.variant.is_active = False
        self.variant.save(update_fields=["is_active"])

        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            create_order_from_cart(
                customer=self.user,
                cart=self.cart,
                checkout_data=self.checkout_data,
            )

        self.assertEqual(Order.objects.count(), 0)



