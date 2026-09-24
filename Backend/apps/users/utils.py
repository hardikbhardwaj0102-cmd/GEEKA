import hashlib
import secrets


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()