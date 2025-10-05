import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { PromoSlider, PromoSlide } from "@/components/PromoSlider";
import { getCategoryInfo, productCategories } from "@/lib/categories";

const fallbackSlides: PromoSlide[] = [
  {
    title: "Promo Spesial Minggu Ini",
    description: "Nikmati potongan harga hingga 40% untuk produk pilihan.",
    highlight: "Diskon Terbatas",
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Belanja Sekarang",
    ctaHref: "/product",
  },
  {
    title: "Gratis Ongkir ke Seluruh Indonesia",
    description: "Belanja sekarang dan dapatkan pengiriman gratis tanpa minimum belanja.",
    highlight: "Ongkir 0 Rupiah",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Lihat Promo",
    ctaHref: "/product",
  },
  {
    title: "Flash Sale Setiap Hari",
    description: "Produk favorit dengan harga spesial hadir setiap hari jam 12.00-15.00.",
    highlight: "3 Jam Saja",
    imageUrl:
      "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Ikuti Flash Sale",
    ctaHref: "/product",
  },
];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { seller: true }
  });
  const promoBanners = await prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
  const slides: PromoSlide[] = promoBanners.map((banner) => ({
    title: banner.title,
    description: banner.description,
    highlight: banner.highlight,
    imageUrl: banner.imageUrl,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
  }));
  const categories = productCategories;
  return (
    <div className="space-y-10">
      <PromoSlider slides={slides.length > 0 ? slides : fallbackSlides} />

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
          {products.map(p => {
            const category = getCategoryInfo(p.category);
            const originalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : null;
            const showOriginal = originalPrice !== null && originalPrice > p.price;
            const categoryLabel = category?.name ?? p.category.replace(/-/g, ' ');
            const categoryEmoji = category?.emoji ?? '🏷️';
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-lg border bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/product/${p.id}`} className="block">
                  <img
                    src={p.imageUrl || 'https://placehold.co/600x400?text=Produk'}
                    className="h-40 w-full object-cover"
                    alt={p.title}
                  />
                </Link>
                <div className="p-3">
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                    <span>{categoryEmoji}</span>
                    <span className="capitalize">{categoryLabel}</span>
                  </div>
                  <Link href={`/product/${p.id}`} className="font-medium line-clamp-1 hover:text-indigo-600">
                    {p.title}
                  </Link>
                  <div className="text-sm text-gray-500">
                    Seller:{' '}
                    <Link className="underline hover:text-indigo-600" href={`/s/${p.seller.slug}`}>
                      {p.seller.name}
                    </Link>
                  </div>
                  {showOriginal && (
                    <div className="text-xs text-gray-400 line-through">Rp {formatIDR(originalPrice)}</div>
                  )}
                  <div className="mt-1 text-lg font-semibold text-indigo-600">Rp {formatIDR(p.price)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
