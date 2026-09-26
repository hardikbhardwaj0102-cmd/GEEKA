from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, VerifyEmailSerializer
from apps.users.services import verify_email_otp


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