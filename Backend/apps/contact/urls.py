from django.urls import path

from .views import (
    ContactMessageCreateView,
    ContactMessageDetailView,
    ContactMessageListView,
)

urlpatterns = [
    path("messages/", ContactMessageCreateView.as_view(), name="contact-message-create"),
    path("messages/admin/",ContactMessageListView.as_view(),name="contact-message-list",),
    path("messages/admin/<uuid:pk>/",ContactMessageDetailView.as_view(),name="contact-message-detail",),
]