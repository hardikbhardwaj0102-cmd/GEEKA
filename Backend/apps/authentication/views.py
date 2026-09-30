from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, VerifyEmailSerializer , LoginSerializer , PasswordResetConfirmSerializer, PasswordResetRequestSerializer , PasswordResetVerifySerializer
from apps.users.services import verify_email_otp
from django.contrib.auth import login
from apps.cart.services import merge_guest_cart_into_user_cart
from django.middleware.csrf import get_token
from rest_framework.permissions import AllowAny
from django.contrib.auth import logout
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
from apps.users.email_service import send_password_reset_email
from apps.users.services import (
    create_password_reset_verification,
    verify_password_reset_otp,
)
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator



User = get_user_model()



@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "csrfToken": get_token(request),
            }
        )



class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Registration successful. Verification code sent to your email.",
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "full_name": user.full_name,
                        "email_verified": user.email_verified,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )



class VerifyEmailView(APIView):

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]
        otp = serializer.validated_data["otp"]

        success, message = verify_email_otp(user, otp)

        if not success:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": message,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                },
            },
            status=status.HTTP_200_OK,
        )



class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]

        guest_token = request.COOKIES.get("geeka_guest_cart")

        login(request, user)

        if guest_token:
            merge_guest_cart_into_user_cart(
                user=user,
                guest_token=guest_token,
            )

        response = Response(
            {
                "message": "Login successful.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                },
            },
            status=status.HTTP_200_OK,
        )

        if guest_token:
            response.delete_cookie("geeka_guest_cart")

        return response



class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                }
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)

        return Response(
            {
                "message": "Logout successful."
            },
            status=status.HTTP_200_OK,
        )



class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(
                email=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "message": "If an account exists with this email, a password reset code has been sent."
                },
                status=status.HTTP_200_OK,
            )

        _, otp = create_password_reset_verification(user)

        send_password_reset_email(
            user.email,
            otp,
        )

        return Response(
            {
                "message": "If an account exists with this email, a password reset code has been sent."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, result = verify_password_reset_otp(user, otp)

        if not success:
            return Response(
                {"error": result},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Verification code is valid."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid password reset request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, result = verify_password_reset_otp(user, otp)

        if not success:
            return Response(
                {"error": result},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=["password"])

        result.used_at = timezone.now()
        result.save(update_fields=["used_at"])

        return Response(
            {
                "message": "Password reset successful. Please log in with your new password."
            },
            status=status.HTTP_200_OK,
        )