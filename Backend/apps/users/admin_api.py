
import uuid

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.views import build_order_response
from decimal import Decimal

from django.db.models import Q, Count, Sum, Value, DecimalField
from django.db.models.functions import Coalesce


User = get_user_model()


class AdminCustomerPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminCustomerListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        customers = User.objects.filter(
            is_staff=False,
            is_superuser=False,
        ).annotate(
            order_count=Count("orders", distinct=True),
            total_order_value=Coalesce(
                Sum("orders__total"),
                Value(Decimal("0.00")),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            ),
        ).order_by("-date_joined")

        search = request.query_params.get("search", "").strip()

        if search:
            search_query = (
                Q(full_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )

            try:
                customer_id = uuid.UUID(search)
            except ValueError:
                pass
            else:
                search_query |= Q(id=customer_id)

            customers = customers.filter(search_query)

        paginator = AdminCustomerPagination()
        page = paginator.paginate_queryset(
            customers, request, view=self
        )

        results = [
            {
                "id": str(customer.id),
                "full_name": customer.full_name,
                "email": customer.email,
                "phone_number": customer.phone_number,
                "date_joined": customer.date_joined,
                "is_active": customer.is_active,
                "order_count": customer.order_count,
                "total_order_value": str(customer.total_order_value),
            }
            for customer in page
        ]

        return paginator.get_paginated_response(results)


class AdminCustomerDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, customer_id):
        try:
            customer_uuid = uuid.UUID(str(customer_id))
        except ValueError:
            return Response(
                {"detail": "Invalid customer ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = User.objects.filter(
            pk=customer_uuid,
            is_staff=False,
            is_superuser=False,
        ).annotate(
            order_count=Count("orders", distinct=True),
            total_order_value=Coalesce(
                Sum("orders__total"),
                Value(Decimal("0.00")),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            ),
        ).first()

        if customer is None:
            return Response(
                {"detail": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "id": str(customer.id),
            "full_name": customer.full_name,
            "email": customer.email,
            "phone_number": customer.phone_number,
            "email_verified": customer.email_verified,
            "date_joined": customer.date_joined,
            "is_active": customer.is_active,
            "order_count": customer.order_count,
            "total_order_value": str(customer.total_order_value),
        })



class AdminCustomerStatusUpdateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, customer_id):
        try:
            customer_uuid = uuid.UUID(str(customer_id))
        except ValueError:
            return Response(
                {"detail": "Invalid customer ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = User.objects.filter(
            pk=customer_uuid,
            is_staff=False,
            is_superuser=False,
        ).first()

        if customer is None:
            return Response(
                {"detail": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"is_active": "A boolean value is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer.is_active = is_active
        customer.save(update_fields=["is_active"])

        return Response({
            "id": str(customer.id),
            "full_name": customer.full_name,
            "email": customer.email,
            "is_active": customer.is_active,
        })





class AdminCustomerOrdersView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, customer_id):
        try:
            customer_uuid = uuid.UUID(str(customer_id))
        except ValueError:
            return Response(
                {"detail": "Invalid customer ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = User.objects.filter(
            pk=customer_uuid,
            is_staff=False,
            is_superuser=False,
        ).first()

        if customer is None:
            return Response(
                {"detail": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        orders = Order.objects.filter(
            customer=customer,
        ).order_by("-created_at")

        paginator = AdminCustomerPagination()
        page = paginator.paginate_queryset(
            orders,
            request,
            view=self,
        )

        results = [
            build_order_response(order)
            for order in page
        ]

        return paginator.get_paginated_response(results)
