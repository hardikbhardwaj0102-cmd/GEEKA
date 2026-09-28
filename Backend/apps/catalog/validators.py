from PIL import Image, UnidentifiedImageError
from django.core.exceptions import ValidationError


MAX_IMAGE_SIZE = 400 * 1024  # 400 KB
MAX_IMAGE_WIDTH = 2000
MAX_IMAGE_HEIGHT = 2000

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_product_image(image_file):
    if image_file.size > MAX_IMAGE_SIZE:
        raise ValidationError(
            "Image size must be 400 KB or less."
        )

    try:
        image = Image.open(image_file)
        image.verify()
    except (UnidentifiedImageError, OSError):
        raise ValidationError(
            "Invalid or corrupted image file."
        )

    image_file.seek(0)

    try:
        image = Image.open(image_file)
    except (UnidentifiedImageError, OSError):
        raise ValidationError(
            "Invalid image file."
        )

    if image.format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            "Only JPG, JPEG, PNG, and WebP images are allowed."
        )

    width, height = image.size

    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
        raise ValidationError(
            "Image dimensions must not exceed 2000 × 2000 pixels."
        )

    image_file.seek(0)

    return True