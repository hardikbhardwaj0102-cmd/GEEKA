import hashlib
import secrets
import uuid


def generate_order_number():
    """
    Generate a readable order reference.
    The database uniqueness constraint remains the final safeguard.
    """
    return f"GK-{uuid.uuid4().hex[:12].upper()}"
