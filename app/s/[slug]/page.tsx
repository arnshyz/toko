import { prisma } from "@/lib/prisma";
import { getCategoryInfo } from "@/lib/categories";
import { formatIDR } from "@/lib/utils";

export default async function Storefront({ params }: { params: { slug: string } }) {
  const seller = await prisma.user.findUnique({ where: { slug: params.slug } });
  if (!seller) return <div>Toko tidak ditemukan</div>;
  const products = await prisma.product.findMany({ where: { sellerId: seller.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Toko {seller.name}</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map(p => {
            const category = getCategoryInfo(p.category);
            const categoryLabel = category?.name ?? p.category.replace(/-/g, ' ');
            const categoryEmoji = category?.emoji ?? '🏷️';
            const originalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : null;
            const showOriginal = originalPrice !== null && originalPrice > p.price;
            return (
              <a key={p.id} href={`/product/${p.id}`} className="overflow-hidden rounded-lg border bg-white transition hover:-translate-y-1 hover:shadow-lg">
                <img src={p.imageUrl || 'https://placehold.co/600x400?text=Produk'} className="h-40 w-full object-cover" />
                <div className="p-3">
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                    <span>{categoryEmoji}</span>
                    <span className="capitalize">{categoryLabel}</span>
                  </div>
                  <div className="font-medium line-clamp-1">{p.title}</div>
                  {showOriginal && (
                    <div className="text-xs text-gray-400 line-through">Rp {formatIDR(originalPrice)}</div>
                  )}
                  <div className="mt-1 text-lg font-semibold text-indigo-600">Rp {formatIDR(p.price)}</div>
                </div>
              </a>
            );
          })}
        </div>
    </div>
  );
}
