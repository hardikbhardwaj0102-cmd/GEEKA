
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product, ProductVariant
from apps.orders.models import Order
from django.core.exceptions import ValidationError
from apps.orders.services import (
    create_order_from_cart,
    cancel_order,
)

from rest_framework import status
from rest_framework.test import APITestCase



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


    
    def test_cancel_order_restores_stock(self):
        # Arrange: create an order, which reduces stock from 10 to 8.
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        self.assertTrue(created)

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)

        # Act: cancel the order.
        cancelled_order = cancel_order(
            order_id=order.id,
            customer=self.user,
        )

        # Assert: the order is cancelled.
        self.assertEqual(
            cancelled_order.status,
            Order.Status.CANCELLED,
        )

        # Assert: the two ordered units return to stock.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)

    def test_cannot_cancel_same_order_twice(self):
        # Create an order; stock drops from 10 to 8.
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        self.assertTrue(created)

        # First cancellation should succeed.
        cancel_order(
            order_id=order.id,
            customer=self.user,
        )

        # A second cancellation should be rejected.
        with self.assertRaises(ValidationError):
            cancel_order(
                order_id=order.id,
                customer=self.user,
            )

        # Stock must remain 10, not increase to 12.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)


    
    def test_cannot_cancel_confirmed_order(self):
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])

        with self.assertRaises(ValidationError):
            cancel_order(
                order_id=order.id,
                customer=self.user,
            )

        # Stock must not be restored for an ineligible order.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)

    def test_cannot_cancel_paid_order(self):
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=["payment_status"])

        with self.assertRaises(ValidationError):
            cancel_order(
                order_id=order.id,
                customer=self.user,
            )

        # Stock must not be restored for a paid order.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)



    
    def test_customer_cannot_cancel_another_customers_order(self):
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        another_user = User.objects.create_user(
            email="another-customer@example.com",
            full_name="Another Customer",
            password="TestPassword123!",
        )

        with self.assertRaises(ValidationError):
            cancel_order(
                order_id=order.id,
                customer=another_user,
            )

        # The original order remains pending.
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)

        # The original stock deduction remains unchanged.
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)


    
    def test_cancel_order_when_variant_has_been_deleted(self):
        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )

        # Deleting the variant sets the order item's variant to NULL.
        self.variant.delete()

        order_item = order.items.first()
        self.assertIsNone(order_item.product_variant_id)

        # Cancellation should still succeed.
        cancelled_order = cancel_order(
            order_id=order.id,
            customer=self.user,
        )

        self.assertEqual(
            cancelled_order.status,
            Order.Status.CANCELLED,
        )





class OrderCancellationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="cancel-api@example.com",
            full_name="Cancellation API User",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            email="other-cancel-api@example.com",
            full_name="Other Cancellation User",
            password="TestPassword123!",
        )

        self.category = Category.objects.create(
            name="Cancellation Test Category",
            slug="cancellation-test-category",
            is_active=True,
        )

        self.product = Product.objects.create(
            name="Cancellation Test Product",
            slug="cancellation-test-product",
            category=self.category,
            status=Product.Status.PUBLISHED,
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="CANCEL-API-001",
            price=Decimal("250.00"),
            currency="INR",
            stock=10,
            is_active=True,
        )

        self.cart = Cart.objects.create(user=self.user)

        CartItem.objects.create(
            cart=self.cart,
            product_variant=self.variant,
            quantity=2,
        )

        self.checkout_data = {
            "contact_name": "Cancellation API User",
            "contact_email": "cancel-api@example.com",
            "contact_phone": "9876543210",
            "recipient_name": "Cancellation API User",
            "delivery_phone": "9876543210",
            "address_line1": "123 Test Street",
            "address_line2": "",
            "city": "New Delhi",
            "state": "Delhi",
            "postal_code": "110001",
        }

    def create_order(self):
        from apps.orders.services import create_order_from_cart

        order, created = create_order_from_cart(
            customer=self.user,
            cart=self.cart,
            checkout_data=self.checkout_data,
        )
        self.assertTrue(created)
        return order

    def test_authenticated_customer_can_cancel_order(self):
        order = self.create_order()
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.variant.refresh_from_db()

        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(self.variant.stock, 10)
        self.assertEqual(
            response.data["order"]["id"],
            str(order.id),
        )

    def test_unauthenticated_customer_cannot_cancel_order(self):
        order = self.create_order()

        response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

        order.refresh_from_db()
        self.variant.refresh_from_db()

        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(self.variant.stock, 8)

    def test_customer_cannot_cancel_another_customers_order(self):
        order = self.create_order()
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        order.refresh_from_db()
        self.variant.refresh_from_db()

        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(self.variant.stock, 8)

    def test_cannot_cancel_already_cancelled_order(self):
        order = self.create_order()
        self.client.force_authenticate(user=self.user)

        first_response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )
        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        second_response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)

    def test_cannot_cancel_confirmed_order_through_api(self):
        order = self.create_order()
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)

    def test_cannot_cancel_paid_order_through_api(self):
        order = self.create_order()
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=["payment_status"])

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/v1/orders/{order.id}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)

    def test_cancelling_nonexistent_order_returns_bad_request(self):
        import uuid

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/v1/orders/{uuid.uuid4()}/cancel/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
