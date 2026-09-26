from django.urls import path

from .views import RegisterView, VerifyEmailView, LoginView , CSRFTokenView

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/",VerifyEmailView.as_view(),name="verify-email"),
    path("login/", LoginView.as_view(), name="login"),
]