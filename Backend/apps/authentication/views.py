from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, VerifyEmailSerializer , LoginSerializer , PasswordResetConfirmSerializer, PasswordResetRequestSerializer , PasswordResetVerifySerializer,  VerifyEmailChangeSerializer
from apps.users.services import verify_email_otp
from django.contrib.auth import login
from apps.cart.services import merge_guest_cart_into_user_cart
from django.middleware.csrf import get_token
from rest_framework.permissions import AllowAny
from django.contrib.auth import logout
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
from apps.users.email_service import send_password_reset_email , send_email_change_otp
from apps.users.services import (
    create_password_reset_verification,
    verify_password_reset_otp,
)
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from apps.users.serializers import CustomerProfileSerializer

from apps.users.models import EmailChangeVerification
from apps.users.utils import generate_otp, hash_otp
from apps.authentication.serializers import RequestEmailChangeSerializer
from datetime import timedelta
from django.db import transaction, IntegrityError


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
        serializer = CustomerProfileSerializer(request.user)

        return Response(
            {
                "user": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        serializer = CustomerProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "message": "Profile updated successfully.",
                "user": serializer.data,
            },
            status=status.HTTP_200_OK,
        )




class RequestEmailChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RequestEmailChangeSerializer(
            data=request.data,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_email = serializer.validated_data["new_email"]

        # Invalidate any previous unused email-change codes.
        EmailChangeVerification.objects.filter(
            user=request.user,
            used_at__isnull=True,
        ).update(used_at=timezone.now())

        otp = generate_otp()

        verification = EmailChangeVerification.objects.create(
            user=request.user,
            new_email=new_email,
            otp_hash=hash_otp(otp),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            send_email_change_otp(new_email, otp)
        except Exception:
            verification.used_at = timezone.now()
            verification.save(update_fields=["used_at"])

            return Response(
                {"error": "Unable to send the verification email. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "Verification code sent to your new email address."},
            status=status.HTTP_200_OK,
        )



class VerifyEmailChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyEmailChangeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_email = serializer.validated_data["new_email"]
        otp = serializer.validated_data["otp"]

        verification = EmailChangeVerification.objects.filter(
            user=request.user,
            new_email=new_email,
            used_at__isnull=True,
        ).order_by("-created_at").first()

        if verification is None:
            return Response(
                {"error": "No active verification code found for this email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.expires_at <= timezone.now():
            return Response(
                {"error": "Verification code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.attempts >= 5:
            return Response(
                {"error": "Maximum verification attempts exceeded. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.attempts += 1
        verification.save(update_fields=["attempts"])

        if hash_otp(otp) != verification.otp_hash:
            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # Lock the verification record during the update.
                verification = EmailChangeVerification.objects.select_for_update().get(
                    pk=verification.pk,
                    user=request.user,
                    used_at__isnull=True,
                )

                if User.objects.filter(email=new_email).exclude(
                    pk=request.user.pk
                ).exists():
                    verification.used_at = timezone.now()
                    verification.save(update_fields=["used_at"])

                    return Response(
                        {
                            "error": "This email address is already associated with another account."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Lock the user record and apply the email change.
                user = User.objects.select_for_update().get(pk=request.user.pk)
                user.email = new_email
                user.email_verified = True
                user.save(
                    update_fields=["email", "email_verified", "updated_at"]
                )

                verification.used_at = timezone.now()
                verification.save(update_fields=["used_at"])

        except EmailChangeVerification.DoesNotExist:
            return Response(
                {"error": "This verification code has already been used or is no longer active."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError:
            return Response(
                {"error": "This email address is already associated with another account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Email address updated successfully.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                },
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