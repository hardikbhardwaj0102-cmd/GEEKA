from django.urls import path

from .views import RegisterView, VerifyEmailView, LoginView , CSRFTokenView, MeView, LogoutView

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/",VerifyEmailView.as_view(),name="verify-email"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/",MeView.as_view(),name="me"),
    path("logout/",LogoutView.as_view(),name="logout"),
]