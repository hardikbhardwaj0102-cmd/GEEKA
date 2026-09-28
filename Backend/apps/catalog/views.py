from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product
from .product_image_service import create_product_image
from .serializers import ProductImageUploadSerializer
from .supabase_storage import create_product_image_signed_url


class AdminProductImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

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