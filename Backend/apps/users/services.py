from datetime import timedelta

from django.utils import timezone

from .models import EmailVerification
from .utils import generate_otp, hash_otp
from .models import EmailVerification, PasswordResetVerification


OTP_EXPIRY_MINUTES = 10

def create_email_verification(user):
    # Invalidate previous unused verifications
    EmailVerification.objects.filter(
        user=user,
        used_at__isnull=True,
    ).update(
        used_at=timezone.now(),
    )

    otp = generate_otp()

    verification = EmailVerification.objects.create(
        user=user,
        otp_hash=hash_otp(otp),
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )

    return verification, otp



MAX_OTP_ATTEMPTS = 5

def verify_email_otp(user, otp):
    verification = (
        EmailVerification.objects
        .filter(
            user=user,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if verification is None:
        return False, "No active verification code found."

    if verification.expires_at <= timezone.now():
        return False, "Verification code has expired."

    if verification.attempts >= MAX_OTP_ATTEMPTS:
        return False, "Maximum verification attempts exceeded."

    verification.attempts += 1
    verification.save(update_fields=["attempts"])

    if hash_otp(otp) != verification.otp_hash:
        return False, "Invalid verification code."

    verification.used_at = timezone.now()
    verification.save(update_fields=["used_at"])

    user.email_verified = True
    user.save(update_fields=["email_verified"])

    return True, "Email verified successfully."



PASSWORD_RESET_EXPIRY_MINUTES = 10
MAX_PASSWORD_RESET_ATTEMPTS = 5


def create_password_reset_verification(user):
    PasswordResetVerification.objects.filter(
        user=user,
        used_at__isnull=True,
    ).update(
        used_at=timezone.now(),
    )

    otp = generate_otp()

    verification = PasswordResetVerification.objects.create(
        user=user,
        otp_hash=hash_otp(otp),
        expires_at=timezone.now()
        + timedelta(minutes=PASSWORD_RESET_EXPIRY_MINUTES),
    )

    return verification, otp


def verify_password_reset_otp(user, otp):
    verification = (
        PasswordResetVerification.objects
        .filter(
            user=user,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if verification is None:
        return False, "No active password reset code found."

    if verification.expires_at <= timezone.now():
        return False, "Password reset code has expired."

    if verification.attempts >= MAX_PASSWORD_RESET_ATTEMPTS:
        return False, "Maximum verification attempts exceeded."

    verification.attempts += 1
    verification.save(update_fields=["attempts"])

    if hash_otp(otp) != verification.otp_hash:
        return False, "Invalid verification code."

    return True, verification       