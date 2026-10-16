
from datetime import date

from django.db.models import Q
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .views import build_order_response
from .services import transition_order_status , cancel_order

from django.core.exceptions import ValidationError as DjangoValidationError

class AdminOrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminOrderListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = (
            Order.objects
            .select_related("customer")
            .order_by("-created_at")
        )

        # Search by order number, order UUID, customer name,
        # customer email, or customer UUID.
        search = request.query_params.get("search", "").strip()

        if search:
            import uuid

            search_query = (
                Q(order_number__icontains=search)
                | Q(contact_name__icontains=search)
                | Q(contact_email__icontains=search)
            )

            try:
                search_uuid = uuid.UUID(search)
            except ValueError:
                pass
            else:
                search_query |= Q(id=search_uuid) | Q(customer_id=search_uuid)

            orders = orders.filter(search_query)

            # Also search by the registered customer's UUID.
            # Invalid UUID input is safely ignored.
            import uuid

            try:
                customer_id = uuid.UUID(search)
            except ValueError:
                pass
            else:
                orders = orders.filter(
                    Q(id=customer_id)
                    | Q(customer_id=customer_id)
                    | Q(order_number__icontains=search)
                    | Q(contact_name__icontains=search)
                    | Q(contact_email__icontains=search)
                )

        # Optional order status filter.
        order_status = request.query_params.get("status")

        if order_status:
            valid_statuses = {
                choice[0] for choice in Order.Status.choices
            }

            if order_status not in valid_statuses:
                return Response(
                    {"detail": "Invalid order status."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            orders = orders.filter(status=order_status)

        # Optional payment status filter.
        payment_status = request.query_params.get(
            "payment_status"
        )

        if payment_status:
            valid_payment_statuses = {
                choice[0]
                for choice in Order.PaymentStatus.choices
            }

            if payment_status not in valid_payment_statuses:
                return Response(
                    {"detail": "Invalid payment status."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            orders = orders.filter(
                payment_status=payment_status
            )

        # Optional inclusive date range: YYYY-MM-DD.
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        try:
            parsed_from = (
                date.fromisoformat(date_from) if date_from else None
            )
            parsed_to = (
                date.fromisoformat(date_to) if date_to else None
            )
        except ValueError:
            return Response(
                {
                    "detail": (
                        "Dates must use YYYY-MM-DD format."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if parsed_from and parsed_to and parsed_from > parsed_to:
            return Response(
                {
                    "detail": (
                        "date_from cannot be later than date_to."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if parsed_from:
            orders = orders.filter(
                created_at__date__gte=parsed_from
            )

        if parsed_to:
            orders = orders.filter(
                created_at__date__lte=parsed_to
            )

        paginator = AdminOrderPagination()
        page = paginator.paginate_queryset(
            orders,
            request,
            view=self,
        )

        results = [
            {
                "id": str(order.id),
                "order_number": order.order_number,
                "customer_id": (
                    str(order.customer_id)
                    if order.customer_id
                    else None
                ),
                "customer_name": order.contact_name,
                "customer_email": order.contact_email,
                "status": order.status,
                "payment_status": order.payment_status,
                "total": str(order.total),
                "currency": order.currency,
                "created_at": order.created_at,
            }
            for order in page
        ]

        return paginator.get_paginated_response(results)





class AdminOrderDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, order_id):
        order = (
            Order.objects
            .select_related("customer")
            .prefetch_related("items")
            .filter(pk=order_id)
            .first()
        )

        if order is None:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order_data = build_order_response(order)
        order_data["customer_id"] = (
            str(order.customer_id) if order.customer_id else None
        )

        return Response({"order": order_data}, status=status.HTTP_200_OK)




class AdminOrderStatusUpdateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, order_id):
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = transition_order_status(
                order_id=order_id,
                new_status=new_status,
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": str(order.id),
                "order_number": order.order_number,
                "status": order.status,
                "payment_status": order.payment_status,
            },
            status=status.HTTP_200_OK,
        )




class AdminOrderCancelView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request, order_id):
        try:
            order = cancel_order(order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": str(order.id),
                "order_number": order.order_number,
                "status": order.status,
                "payment_status": order.payment_status,
            },
            status=status.HTTP_200_OK,
        )
