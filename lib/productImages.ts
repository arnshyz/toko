import type { ProductImage } from "@prisma/client";

export const PRODUCT_IMAGE_PLACEHOLDER = "https://placehold.co/600x400?text=Produk";

export function buildProductImageUrl(productId: string, imageId: string) {
  return `/api/products/${productId}/images/${imageId}`;
}

type ProductWithImages = {
  id: string;
  imageUrl?: string | null;
  images?: Pick<ProductImage, "id">[] | null;
};

export function getPrimaryProductImageSrc(product: ProductWithImages) {
  if (product.images && product.images.length > 0) {
    return buildProductImageUrl(product.id, product.images[0]!.id);
  }
  if (product.imageUrl) {
    return product.imageUrl;
  }
  return PRODUCT_IMAGE_PLACEHOLDER;
}

export function getProductImageSources(productId: string, images: Pick<ProductImage, "id">[]) {
  return images.map((image) => ({
    id: image.id,
    src: buildProductImageUrl(productId, image.id),
  }));
}
