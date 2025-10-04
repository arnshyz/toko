import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { PromoSlider } from "@/components/PromoSlider";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { seller: true }
  });
  const categories = [
    { slug: "elektronik", name: "Elektronik", description: "Gadget & aksesoris", emoji: "🔌" },
    { slug: "fashion", name: "Fashion", description: "Gaya terkini", emoji: "👗" },
    { slug: "rumah-tangga", name: "Rumah Tangga", description: "Peralatan rumah", emoji: "🏠" },
    { slug: "kecantikan", name: "Kecantikan", description: "Perawatan diri", emoji: "💄" },
    { slug: "olahraga", name: "Olahraga", description: "Perlengkapan sport", emoji: "🏃" },
    { slug: "hobi", name: "Hobi", description: "Koleksi & hobi", emoji: "🎨" }
  ];
  return (
    <div className="space-y-10">
      <PromoSlider />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Kategori Populer</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {categories.map(category => (
            <Link
              key={category.slug}
              href={`/?category=${category.slug}`}
              className="group rounded-xl border bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">{category.emoji}</div>
              <div className="mt-2 font-semibold text-gray-800">{category.name}</div>
              <div className="text-xs text-gray-500 transition group-hover:text-gray-700">
                {category.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Produk Terbaru</h1>
          <Link
            href="/product"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map(p => (
            <div key={p.id} className="overflow-hidden rounded-lg border bg-white shadow transition hover:-translate-y-1 hover:shadow-lg">
              <Link href={`/product/${p.id}`} className="block">
                <img
                  src={p.imageUrl || 'https://placehold.co/600x400?text=Produk'}
                  className="h-40 w-full object-cover"
                  alt={p.title}
                />
              </Link>
              <div className="p-3">
                <Link href={`/product/${p.id}`} className="font-medium line-clamp-1 hover:text-indigo-600">
                  {p.title}
                </Link>
                <div className="text-sm text-gray-500">
                  Seller:{' '}
                  <Link className="underline hover:text-indigo-600" href={`/s/${p.seller.slug}`}>
                    {p.seller.name}
                  </Link>
                </div>
                <div className="mt-1 font-semibold">Rp {formatIDR(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
