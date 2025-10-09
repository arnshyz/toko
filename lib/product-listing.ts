import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { getCategoryDataset } from "@/lib/categories";
import { getProductRatingSummary } from "@/lib/product-ratings";

export type ProductListingFilters = {
  categorySlug?: string | null;
  minRating?: number | null;
  minSold?: number | null;
  searchQuery?: string | null;
  sort?: "newest" | "price-asc" | "price-desc" | "sold" | "best" | "rating" | null;
};

export type ProductListingItem = {
  id: string;
  slug: string;
  title: string;
  salePrice: number;
  basePrice: number;
  originalPrice: number | null;
  categorySlug: string;
  categoryLabel: string;
  categoryEmoji: string;
  sellerName: string;
  sellerSlug: string;
  storeBadge: string | null;
  imageUrl: string;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  createdAt: Date;
};

export async function fetchProductListing(filters: ProductListingFilters) {
  const categoryDataset = await getCategoryDataset();
  const categoryInfoMap = categoryDataset.infoBySlug;

  const categorySlugs = (() => {
    if (!filters.categorySlug) {
      return undefined;
    }

    const info = categoryInfoMap.get(filters.categorySlug);
    if (!info) {
      return undefined;
    }

    if (info.parentSlug) {
      return [info.slug];
    }

    const childSlugs = categoryDataset.options
      .filter((option) => option.parentSlug === info.slug)
      .map((option) => option.slug);

    return [info.slug, ...childSlugs];
  })();

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (categorySlugs?.length) {
    where.category = { in: categorySlugs };
  } else if (filters.categorySlug) {
    where.category = filters.categorySlug;
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.trim();
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (filters.sort) {
      case "price-asc":
        return [{ price: "asc" }];
      case "price-desc":
        return [{ price: "desc" }];
      case "newest":
        return [{ createdAt: "desc" }];
      default:
        return [{ createdAt: "desc" }];
    }
  })();

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      seller: { select: { name: true, slug: true, storeBadge: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true } },
      flashSales: true,
      _count: { select: { orderItems: true } },
    },
  });

  if (products.length === 0) {
    return [] as ProductListingItem[];
  }

  const now = new Date();
  const ratingSummary = await getProductRatingSummary(products.map((product) => product.id));

  const items: ProductListingItem[] = products.map((product) => {
    const category = categoryInfoMap.get(product.category);
    const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
    const salePrice = activeFlashSale
      ? calculateFlashSalePrice(product.price, activeFlashSale)
      : product.price;
    const originalReference = product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : product.price;
    const originalPrice = activeFlashSale && originalReference > salePrice ? originalReference : product.originalPrice ?? null;
    const rating = ratingSummary.get(product.id);
    const average = rating?.average ?? 0;
    const count = rating?.count ?? 0;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      salePrice,
      basePrice: product.price,
      originalPrice,
      categorySlug: product.category,
      categoryLabel: category?.name ?? product.category,
      categoryEmoji: category?.emoji ?? "🏷️",
      sellerName: product.seller.name,
      sellerSlug: product.seller.slug,
      storeBadge: product.seller.storeBadge ?? null,
      imageUrl: getPrimaryProductImageSrc(product),
      ratingAverage: average,
      ratingCount: count,
      soldCount: product._count.orderItems,
      createdAt: product.createdAt,
    };
  });

  const filtered = items.filter((item) => {
    if (filters.minRating && item.ratingAverage < filters.minRating) {
      return false;
    }
    if (filters.minSold && item.soldCount < filters.minSold) {
      return false;
    }
    return true;
  });

  const sorted = (() => {
    switch (filters.sort) {
      case "sold":
        return [...filtered].sort((a, b) => b.soldCount - a.soldCount);
      case "best":
        return [...filtered].sort((a, b) => {
          if (b.ratingAverage === a.ratingAverage) {
            return b.soldCount - a.soldCount;
          }
          return b.ratingAverage - a.ratingAverage;
        });
      case "rating":
        return [...filtered].sort((a, b) => b.ratingAverage - a.ratingAverage);
      case "price-asc":
        return [...filtered].sort((a, b) => a.salePrice - b.salePrice);
      case "price-desc":
        return [...filtered].sort((a, b) => b.salePrice - a.salePrice);
      default:
        return filtered;
    }
  })();

  return sorted;
}
