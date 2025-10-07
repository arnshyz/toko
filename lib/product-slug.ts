import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function buildBaseSlug(title: string) {
  const normalized = slugify(title).slice(0, 60);
  if (normalized) {
    return normalized;
  }
  const randomToken = Math.random().toString(36).slice(2, 10);
  return `produk-${randomToken}`;
}

export async function generateUniqueProductSlug(title: string, excludeProductId?: string) {
  const baseSlug = buildBaseSlug(title);
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeProductId && existing.id === excludeProductId)) {
      return candidate;
    }

    attempt += 1;
    if (attempt > 50) {
      const fallback = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const fallbackExisting = await prisma.product.findUnique({
        where: { slug: fallback },
        select: { id: true },
      });
      if (!fallbackExisting || (excludeProductId && fallbackExisting.id === excludeProductId)) {
        return fallback;
      }
    }
  }
}
