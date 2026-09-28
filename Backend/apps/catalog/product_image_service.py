from pathlib import Path
from uuid import uuid4

from django.db import transaction

from .models import ProductImage
from .supabase_storage import (
    upload_product_image,
    delete_product_image,
)
from .validators import validate_product_image


ALLOWED_EXTENSIONS = {
    ".jpg": ".jpg",
    ".jpeg": ".jpeg",
    ".png": ".png",
    ".webp": ".webp",
}


MAX_PRODUCT_IMAGES = 5


def create_product_image(product, image_file, display_order=0, is_primary=False):
    validate_product_image(image_file)

    original_extension = Path(image_file.name).suffix.lower()

    if original_extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported image extension.")

    extension = ALLOWED_EXTENSIONS[original_extension]
    filename = f"{uuid4().hex}{extension}"

    with transaction.atomic():
        image_count = ProductImage.objects.filter(
            product=product
        ).count()

        if image_count >= MAX_PRODUCT_IMAGES:
            raise ValueError(
                "A product can have a maximum of 5 images."
            )

        if is_primary:
            ProductImage.objects.filter(
                product=product,
                is_primary=True,
            ).update(is_primary=False)

        storage_path = upload_product_image(
            image_file,
            product.id,
            filename,
        )

        try:
            product_image = ProductImage.objects.create(
                product=product,
                image=storage_path,
                display_order=display_order,
                is_primary=is_primary,
                is_active=True,
            )
        except Exception:
            delete_product_image(storage_path)
            raise

    return product_image