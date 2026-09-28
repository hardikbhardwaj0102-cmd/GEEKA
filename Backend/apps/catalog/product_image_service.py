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


def create_product_image(product, image_file, display_order=0, is_primary=False):
    # 1. Validate image
    validate_product_image(image_file)

    # 2. Generate a safe server-side filename
    original_extension = Path(image_file.name).suffix.lower()

    if original_extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported image extension.")

    extension = ALLOWED_EXTENSIONS[original_extension]

    filename = f"{uuid4().hex}{extension}"

    # 3. Upload to private Supabase Storage
    storage_path = upload_product_image(
        image_file,
        product.id,
        filename,
    )

    try:
        # 4. Create database record
        with transaction.atomic():
            product_image = ProductImage.objects.create(
                product=product,
                image=storage_path,
                display_order=display_order,
                is_primary=is_primary,
                is_active=True,
            )

    except Exception:
        # 5. Database failed after storage upload.
        # Remove the orphaned storage object.
        delete_product_image(storage_path)
        raise

    return product_image