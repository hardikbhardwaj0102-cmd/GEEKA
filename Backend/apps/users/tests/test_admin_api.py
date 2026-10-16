
from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework.test import APITestCase

User = get_user_model()


class AdminCustomerAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@geeka.test",
            full_name="GEEKA Admin",
            password="TestAdmin123!",
        )

        self.customer = User.objects.create_user(
            email="customer@geeka.test",
            full_name="Test Customer",
            password="TestCustomer123!",
        )

        self.client.force_authenticate(user=self.admin)

    def test_admin_can_list_customers(self):
        response = self.client.get(
            reverse("admin-customer-list")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["email"],
            "customer@geeka.test",
        )

    def test_admin_can_view_customer_details(self):
        response = self.client.get(
            reverse(
                "admin-customer-detail",
                kwargs={"customer_id": self.customer.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "customer@geeka.test")

    def test_admin_can_deactivate_customer(self):
        response = self.client.patch(
            reverse(
                "admin-customer-status-update",
                kwargs={"customer_id": self.customer.id},
            ),
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    def test_non_admin_cannot_list_customers(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("admin-customer-list")
        )

        self.assertEqual(response.status_code, 403)


    
    def test_admin_can_search_customers_by_name(self):
        response = self.client.get(
            reverse("admin-customer-list"),
            {"search": "Test Customer"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["email"],
            "customer@geeka.test",
        )

    def test_admin_can_search_customers_by_email(self):
        response = self.client.get(
            reverse("admin-customer-list"),
            {"search": "customer@geeka.test"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_admin_can_search_customers_by_id(self):
        response = self.client.get(
            reverse("admin-customer-list"),
            {"search": str(self.customer.id)},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["id"],
            str(self.customer.id),
        )

    def test_admin_receives_400_for_invalid_customer_id(self):
        response = self.client.get(
            "/api/v1/users/admin/customers/not-a-uuid/"
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_cannot_update_status_with_non_boolean_value(self):
        response = self.client.patch(
            reverse(
                "admin-customer-status-update",
                kwargs={"customer_id": self.customer.id},
            ),
            {"is_active": "false"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_active)

    def test_admin_can_activate_customer(self):
        self.customer.is_active = False
        self.customer.save(update_fields=["is_active"])

        response = self.client.patch(
            reverse(
                "admin-customer-status-update",
                kwargs={"customer_id": self.customer.id},
            ),
            {"is_active": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_active)

    def test_customer_order_history_only_returns_own_orders(self):
        another_customer = User.objects.create_user(
            email="another@geeka.test",
            full_name="Another Customer",
            password="TestCustomer123!",
        )

        response = self.client.get(
            reverse(
                "admin-customer-orders",
                kwargs={"customer_id": self.customer.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

