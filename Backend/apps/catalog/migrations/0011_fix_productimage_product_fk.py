from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0010_productimage_unique_primary_image_per_product"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE catalog_productimage
                DROP CONSTRAINT catalog_productimage_product_id_1f42dd8c_fk_catalog_product_id;

                ALTER TABLE catalog_productimage
                ADD CONSTRAINT catalog_productimage_product_id_1f42dd8c_fk_catalog_product_id
                FOREIGN KEY (product_id)
                REFERENCES catalog_product(id)
                ON DELETE CASCADE
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="""
                ALTER TABLE catalog_productimage
                DROP CONSTRAINT catalog_productimage_product_id_1f42dd8c_fk_catalog_product_id;

                ALTER TABLE catalog_productimage
                ADD CONSTRAINT catalog_productimage_product_id_1f42dd8c_fk_catalog_product_id
                FOREIGN KEY (product_id)
                REFERENCES catalog_product(id)
                DEFERRABLE INITIALLY DEFERRED;
            """,
        ),
    ]