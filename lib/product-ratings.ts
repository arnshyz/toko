import { prisma } from "@/lib/prisma";

export type ProductRatingSummary = {
  average: number;
  count: number;
};

export async function getProductRatingSummary(productIds: string[]) {
  const uniqueIds = Array.from(new Set(productIds)).filter((id) => Boolean(id));
  if (uniqueIds.length === 0) {
    return new Map<string, ProductRatingSummary>();
  }

  const idSet = new Set(uniqueIds);
  const reviews = await prisma.orderReview.findMany({
    where: {
      order: {
        items: {
          some: {
            productId: { in: uniqueIds },
          },
        },
      },
    },
    select: {
      rating: true,
      order: {
        select: {
          items: {
            select: { productId: true },
          },
        },
      },
    },
  });

  const ratingSum = new Map<string, number>();
  const ratingCount = new Map<string, number>();

  for (const review of reviews) {
    for (const item of review.order.items) {
      if (!idSet.has(item.productId)) continue;
      ratingSum.set(item.productId, (ratingSum.get(item.productId) ?? 0) + review.rating);
      ratingCount.set(item.productId, (ratingCount.get(item.productId) ?? 0) + 1);
    }
  }

  const summary = new Map<string, ProductRatingSummary>();
  for (const id of uniqueIds) {
    const count = ratingCount.get(id) ?? 0;
    const sum = ratingSum.get(id) ?? 0;
    const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    summary.set(id, { average, count });
  }

  return summary;
}
