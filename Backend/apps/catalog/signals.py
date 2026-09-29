from django.db.models.signals import m2m_changed, post_delete
from django.dispatch import receiver

from .models import ProductImage, ProductVariant
from .supabase_storage import delete_product_image


@receiver(m2m_changed, sender=ProductVariant.attribute_values.through)
def update_variant_combination_key(sender, instance, action, **kwargs):
    if action not in ["post_add", "post_remove", "post_clear"]:
        return

    attribute_values = instance.attribute_values.order_by("attribute_id", "id")

    attribute_ids = "-".join(
        str(attribute_value.id)
        for attribute_value in attribute_values
    )

    combination_key = (
        f"{instance.product_id}:{attribute_ids}"
        if attribute_ids
        else None
    )

    ProductVariant.objects.filter(pk=instance.pk).update(
        combination_key=combination_key
    )



@receiver(post_delete, sender=ProductImage)
def delete_product_image_from_storage(sender, instance, **kwargs):
    if not instance.image:
        return

    try:
        delete_product_image(instance.image)
    except Exception:
        # Database deletion has already happened.
        # Storage cleanup failure should not break the database operation.
        pass