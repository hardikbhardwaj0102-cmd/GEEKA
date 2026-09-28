from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from .models import ProductVariant


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