from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser,AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Category , Attribute, ProductVariant, ProductImage
from .product_image_service import create_product_image
from .serializers import (
    AdminCategorySerializer,
    AdminProductSerializer,
    ProductImageUploadSerializer,
    PublicProductListSerializer,
    PublicProductDetailSerializer,
    AdminAttributeSerializer,
    AdminAttributeValueSerializer,
    AdminProductVariantSerializer,
    AdminProductImageSerializer,
    AdminProductImageUpdateSerializer,
)

from django.db import transaction
from .supabase_storage import create_product_image_signed_url , delete_product_image
from .pagination import ProductPagination
from rest_framework.authentication import SessionAuthentication


class AdminProductImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        images = product.images.all().order_by(
            "display_order",
            "created_at",
        )

        serializer = AdminProductImageSerializer(
            images,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        serializer = ProductImageUploadSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            product_image = create_product_image(
                product=product,
                image_file=serializer.validated_data["image_file"],
                display_order=serializer.validated_data["display_order"],
                is_primary=serializer.validated_data["is_primary"],
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        signed_url = create_product_image_signed_url(
            product_image.image
        )

        return Response(
            {
                "id": str(product_image.id),
                "product_id": str(product.id),
                "image_url": signed_url,
                "display_order": product_image.display_order,
                "is_primary": product_image.is_primary,
                "is_active": product_image.is_active,
            },
            status=status.HTTP_201_CREATED,
        )



class AdminProductImageDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, image_id):
        product_image = get_object_or_404(
            ProductImage,
            id=image_id,
        )

        serializer = AdminProductImageUpdateSerializer(
            product_image,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            validated_data = serializer.validated_data

            if validated_data.get("is_primary") is True:
                ProductImage.objects.filter(
                    product=product_image.product,
                    is_primary=True,
                ).exclude(
                    id=product_image.id,
                ).update(
                    is_primary=False,
                )

            product_image = serializer.save()

        response_serializer = AdminProductImageSerializer(
            product_image,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, image_id):
        product_image = get_object_or_404(
            ProductImage,
            id=image_id,
        )

        product_image.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )



class PublicProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        products = (
            Product.objects
            .filter(status=Product.Status.PUBLISHED)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-created_at")
        )

        category_slug = request.query_params.get("category")

        if category_slug:
            products = products.filter(
                category__slug=category_slug,
                category__is_active=True,
            )

        paginator = ProductPagination()

        page = paginator.paginate_queryset(
            products,
            request,
            view=self,
        )

        serializer = PublicProductListSerializer(
            page,
            many=True,
            context={"request": request},
        )

        return paginator.get_paginated_response(
            serializer.data
        )



class PublicProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        product = get_object_or_404(
            Product.objects
            .select_related("category")
            .prefetch_related(
                "images",
                "variants__attribute_values__attribute",
            ),
            id=product_id,
            status=Product.Status.PUBLISHED,
        )

        serializer = PublicProductDetailSerializer(
            product,
            context={"request": request},
        )

        return Response(serializer.data)



class AdminCategoryListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        categories = Category.objects.all().order_by("name")

        paginator = ProductPagination()
        page = paginator.paginate_queryset(
            categories,
            request,
            view=self,
        )

        serializer = AdminCategorySerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AdminCategorySerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)
        category = serializer.save()

        return Response(
            AdminCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


class AdminCategoryDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, category_id):
        category = get_object_or_404(
            Category,
            id=category_id,
        )

        serializer = AdminCategorySerializer(category)

        return Response(serializer.data)

    def patch(self, request, category_id):
        category = get_object_or_404(
            Category,
            id=category_id,
        )

        serializer = AdminCategorySerializer(
            category,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        category = serializer.save()

        return Response(
            AdminCategorySerializer(category).data,
            status=status.HTTP_200_OK,
        )



class AdminProductListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        products = (
            Product.objects
            .select_related("category")
            .order_by("-created_at")
        )

        status_filter = request.query_params.get("status")
        category_filter = request.query_params.get("category")

        if status_filter:
            products = products.filter(status=status_filter)

        if category_filter:
            products = products.filter(category_id=category_filter)

        paginator = ProductPagination()

        page = paginator.paginate_queryset(
            products,
            request,
            view=self,
        )

        serializer = AdminProductSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):
        serializer = AdminProductSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        product = serializer.save(
            status=Product.Status.DRAFT
        )

        return Response(
            AdminProductSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )



class AdminProductDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, product_id):
        product = get_object_or_404(
            Product.objects.select_related("category"),
            id=product_id,
        )

        serializer = AdminProductSerializer(product)

        return Response(serializer.data)

    def patch(self, request, product_id):
        product = get_object_or_404(
            Product.objects.select_related("category"),
            id=product_id,
        )

        serializer = AdminProductSerializer(
            product,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        product = serializer.save()

        return Response(
            AdminProductSerializer(product).data,
            status=status.HTTP_200_OK,
        )


def validate_product_for_publish(product):
    errors = []

    if not product.category:
        errors.append(
            "Product must have a valid category."
        )

    active_variants = product.variants.filter(
        is_active=True
    )

    if not active_variants.exists():
        errors.append(
            "Product must have at least one active variant."
        )

    if not active_variants.filter(
        price__gt=0
    ).exists():
        errors.append(
            "Product must have at least one active variant with a valid price greater than zero."
        )

    active_images = product.images.filter(
        is_active=True
    )

    if not active_images.exists():
        errors.append(
            "Product must have at least one active image."
        )

    primary_image_count = active_images.filter(
        is_primary=True
    ).count()

    if primary_image_count != 1:
        errors.append(
            "Product must have exactly one primary active image."
        )

    return errors



class AdminProductStatusView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, product_id):
        product = get_object_or_404(
            Product.objects.select_related("category"),
            id=product_id,
        )

        new_status = request.data.get("status")

        allowed_statuses = {
            Product.Status.DRAFT,
            Product.Status.PUBLISHED,
            Product.Status.ARCHIVED,
        }

        if new_status not in allowed_statuses:
            return Response(
                {
                    "detail": "Invalid product status."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == Product.Status.PUBLISHED:
            errors = validate_product_for_publish(product)

            if errors:
                return Response(
                    {
                        "detail": "Product cannot be published.",
                        "errors": errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        product.status = new_status
        product.save(update_fields=["status", "updated_at"])

        return Response(
            AdminProductSerializer(product).data,
            status=status.HTTP_200_OK,
        )



class AdminAttributeListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        attributes = Attribute.objects.prefetch_related(
            "values"
        ).order_by("name")

        serializer = AdminAttributeSerializer(
            attributes,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AdminAttributeSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        attribute = serializer.save()

        return Response(
            AdminAttributeSerializer(attribute).data,
            status=status.HTTP_201_CREATED,
        )


class AdminAttributeValueListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, attribute_id):
        attribute = get_object_or_404(
            Attribute,
            id=attribute_id,
        )

        values = attribute.values.all().order_by("value")

        serializer = AdminAttributeValueSerializer(
            values,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request, attribute_id):
        attribute = get_object_or_404(
            Attribute,
            id=attribute_id,
        )

        serializer = AdminAttributeValueSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        attribute_value = serializer.save(
            attribute=attribute
        )

        return Response(
            AdminAttributeValueSerializer(attribute_value).data,
            status=status.HTTP_201_CREATED,
        )



class AdminProductVariantListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, product_id):
        product = get_object_or_404(
            Product,
            id=product_id,
        )

        variants = (
            product.variants
            .prefetch_related(
                "attribute_values__attribute"
            )
            .order_by("created_at")
        )

        serializer = AdminProductVariantSerializer(
            variants,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request, product_id):
        product = get_object_or_404(
            Product,
            id=product_id,
        )

        serializer = AdminProductVariantSerializer(
            data=request.data,
            context={
                "product": product,
            },
        )

        serializer.is_valid(raise_exception=True)

        variant = serializer.save(
            product=product,
            currency="INR",
        )

        return Response(
            AdminProductVariantSerializer(variant).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductVariantDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, variant_id):
        variant = get_object_or_404(
            ProductVariant.objects.prefetch_related(
                "attribute_values__attribute"
            ),
            id=variant_id,
        )

        serializer = AdminProductVariantSerializer(
            variant
        )

        return Response(serializer.data)

    def patch(self, request, variant_id):
        variant = get_object_or_404(
            ProductVariant.objects.prefetch_related(
                "attribute_values__attribute"
            ),
            id=variant_id,
        )

        serializer = AdminProductVariantSerializer(
            variant,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        variant = serializer.save()

        return Response(
            AdminProductVariantSerializer(variant).data,
            status=status.HTTP_200_OK,
        )


class AdminProductVariantDeactivateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, variant_id):
        variant = get_object_or_404(
            ProductVariant,
            id=variant_id,
        )

        variant.is_active = False
        variant.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            AdminProductVariantSerializer(variant).data,
            status=status.HTTP_200_OK,
        )