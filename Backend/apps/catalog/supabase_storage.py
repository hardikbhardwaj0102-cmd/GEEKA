import os

from supabase import create_client


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SECRET_KEY must be configured."
    )


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)

PRODUCT_IMAGE_BUCKET = "product-images"


def upload_product_image(file, product_id, filename):
    storage_path = f"products/{product_id}/{filename}"

    file_data = file.read()

    supabase.storage.from_(PRODUCT_IMAGE_BUCKET).upload(
        storage_path,
        file_data,
        {
            "content-type": file.content_type,
            "upsert": False,
        },
    )

    return storage_path


def delete_product_image(storage_path):
    supabase.storage.from_(PRODUCT_IMAGE_BUCKET).remove(
        [storage_path]
    )


def create_product_image_signed_url(storage_path, expires_in=3600):
    response = supabase.storage.from_(PRODUCT_IMAGE_BUCKET).create_signed_url(
        storage_path,
        expires_in,
    )

    return response["signedURL"]