from rest_framework import generics
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import ContactMessage
from .serializers import (
    ContactMessageAdminSerializer,
    ContactMessageCreateSerializer,
)


class ContactMessageCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = ContactMessage.objects.all()


class ContactMessageDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ContactMessageAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = ContactMessage.objects.all()