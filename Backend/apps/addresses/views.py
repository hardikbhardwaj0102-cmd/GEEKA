from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions

from .models import Address
from .serializers import AddressSerializer

User = get_user_model()


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        with transaction.atomic():
            # Serialize address writes for this customer.
            User.objects.select_for_update().get(
                pk=self.request.user.pk
            )

            has_default = Address.objects.filter(
                user=self.request.user,
                is_default=True,
            ).exists()

            make_default = (
                serializer.validated_data.get("is_default", False)
                or not has_default
            )

            if make_default:
                Address.objects.filter(
                    user=self.request.user,
                    is_default=True,
                ).update(is_default=False)

            serializer.save(
                user=self.request.user,
                is_default=make_default,
            )


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            User.objects.select_for_update().get(
                pk=self.request.user.pk
            )

            # Reload the address after acquiring the user's lock.
            address = Address.objects.select_for_update().get(
                pk=serializer.instance.pk,
                user=self.request.user,
            )
            serializer.instance = address

            was_default = address.is_default
            make_default = serializer.validated_data.get(
                "is_default",
                was_default,
            )

            if make_default:
                Address.objects.filter(
                    user=self.request.user,
                    is_default=True,
                ).exclude(pk=address.pk).update(is_default=False)

                serializer.save(is_default=True)
            else:
                serializer.save(is_default=False)

                if was_default:
                    # Keep a default address whenever any address exists.
                    replacement = (
                        Address.objects.filter(user=self.request.user)
                        .exclude(pk=address.pk)
                        .order_by("-updated_at", "-created_at")
                        .first()
                    )

                    if replacement:
                        replacement.is_default = True
                        replacement.save(
                            update_fields=["is_default", "updated_at"]
                        )
                    else:
                        # The customer's only address remains the default.
                        address.is_default = True
                        address.save(
                            update_fields=["is_default", "updated_at"]
                        )

    def perform_destroy(self, instance):
        with transaction.atomic():
            User.objects.select_for_update().get(
                pk=self.request.user.pk
            )

            address = Address.objects.select_for_update().get(
                pk=instance.pk,
                user=self.request.user,
            )
            was_default = address.is_default
            address.delete()

            if was_default:
                replacement = (
                    Address.objects.filter(user=self.request.user)
                    .order_by("-updated_at", "-created_at")
                    .first()
                )

                if replacement:
                    replacement.is_default = True
                    replacement.save(
                        update_fields=["is_default", "updated_at"]
                    )