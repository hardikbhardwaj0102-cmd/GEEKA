from django.urls import path
from .views import RegisterView, VerifyEmailView, LoginView , CSRFTokenView, MeView, LogoutView, PasswordResetVerifyView, PasswordResetConfirmView, PasswordResetRequestView
from apps.users.views import GoogleLoginView , GoogleCallbackView


urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/",VerifyEmailView.as_view(),name="verify-email"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/",MeView.as_view(),name="me"),
    path("logout/",LogoutView.as_view(),name="logout"),
    path("password-reset/request/",PasswordResetRequestView.as_view(),name="password-reset-request"),
    path("password-reset/verify/",PasswordResetVerifyView.as_view(),name="password-reset-verify"),
    path("password-reset/confirm/",PasswordResetConfirmView.as_view(),name="password-reset-confirm"),
    path("google/login/",GoogleLoginView.as_view(),name="google-login"),
    path("google/callback/",GoogleCallbackView.as_view(),name="google-callback"),
]