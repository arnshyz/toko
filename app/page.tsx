export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { PromoSlider, PromoSlide } from "@/components/PromoSlider";
import { ActiveVoucherPopup } from "@/components/ActiveVoucherPopup";
import { getCategoryInfo } from "@/lib/categories";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { SalesProofTicker } from "@/components/SalesProofTicker";
import { FlashSaleRail } from "@/components/FlashSaleRail";

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
  const now = new Date();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      seller: true,
      images: { select: { id: true }, orderBy: { sortOrder: 'asc' } },
      flashSales: {
        where: { endAt: { gte: now } },
        orderBy: { startAt: 'asc' },
      },
    }
  });
  const promoBanners = await prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
  const activeVouchers = await prisma.voucher.findMany({
    where: {
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: [
      { createdAt: "desc" },
      { code: "asc" },
    ],
    take: 1,
  });
  const highlightedVoucher = activeVouchers[0];
  const slides: PromoSlide[] = promoBanners.map((banner) => ({
    title: banner.title,
    description: banner.description,
    highlight: banner.highlight,
    imageUrl: banner.imageUrl,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
  }));
  const flashSaleProducts = products
    .map((product) => {
      const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
      if (!activeFlashSale) {
        return null;
      }

      const salePrice = calculateFlashSalePrice(product.price, activeFlashSale);
      const originalReference = product.originalPrice && product.originalPrice > product.price
        ? product.originalPrice
        : product.price;
      const originalPrice = originalReference > salePrice ? originalReference : null;

      return {
        id: product.id,
        title: product.title,
        sellerName: product.seller.name,
        sellerSlug: product.seller.slug,
        salePrice,
        discountPercent: activeFlashSale.discountPercent,
        originalPrice,
        imageUrl: getPrimaryProductImageSrc(product),
        endsAt: activeFlashSale.endAt.toISOString(),
        stock: product.stock,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
  return (
    <div className="space-y-10">
      <SalesProofTicker />
      {highlightedVoucher ? (
        <ActiveVoucherPopup
          voucher={{
            id: highlightedVoucher.id,
            code: highlightedVoucher.code,
            kind: highlightedVoucher.kind,
            value: highlightedVoucher.value,
            minSpend: highlightedVoucher.minSpend,
            expiresAt: highlightedVoucher.expiresAt
              ? highlightedVoucher.expiresAt.toISOString()
              : null,
          }}
        />
      ) : null}
      <PromoSlider slides={slides.length > 0 ? slides : fallbackSlides} />

      <div className="space-y-4 md:hidden">
        <div className="rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/70 px-5 py-4 text-gray-900 shadow-xl shadow-[#f53d2d]/10 ring-1 ring-white/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Voucher Pilihan</p>
              <p className="text-lg font-semibold text-[#f53d2d]">
                {highlightedVoucher ? highlightedVoucher.code : "Diskon Spesial"}
              </p>
              <p className="text-xs text-gray-500">
                {highlightedVoucher
                  ? `Potongan hingga Rp ${formatIDR(highlightedVoucher.value)}`
                  : "Nikmati penawaran terbaik setiap hari"}
              </p>
            </div>
            <Link
              href={highlightedVoucher ? `/voucher/${highlightedVoucher.code}` : "/promo"}
              className="rounded-full bg-[#f53d2d] px-4 py-2 text-xs font-semibold text-white shadow"
            >
              Klaim
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center text-xs font-medium text-gray-700">
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">💳</span>
            <span>Pulsa</span>
          </Link>
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">🧾</span>
            <span>Tagihan</span>
          </Link>
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">🎟️</span>
            <span>Voucher</span>
          </Link>
          <Link href="#flash-sale" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">🔥</span>
            <span>Flash</span>
          </Link>
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">🍱</span>
            <span>Food</span>
          </Link>
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">📺</span>
            <span>Video</span>
          </Link>
          <Link href="/promo" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">📡</span>
            <span>Live</span>
          </Link>
          <Link href="/support" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-lg">🆘</span>
            <span>Bantuan</span>
          </Link>
      </div>
      </div>

      <section id="flash-sale">
        <FlashSaleRail items={flashSaleProducts} />
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
            const activeFlashSale = getActiveFlashSale(p.flashSales ?? [], now);
            const salePrice = activeFlashSale
              ? calculateFlashSalePrice(p.price, activeFlashSale)
              : p.price;
            const referenceOriginal = activeFlashSale
              ? originalPrice && originalPrice > p.price
                ? originalPrice
                : p.price
              : originalPrice;
            const showOriginal = referenceOriginal !== null && referenceOriginal > salePrice;
            const categoryLabel = category?.name ?? p.category.replace(/-/g, ' ');
            const categoryEmoji = category?.emoji ?? '🏷️';
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-lg border bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/product/${p.id}`} className="block">
                  <img
                    src={getPrimaryProductImageSrc(p)}
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
                  {activeFlashSale && (
                    <div className="mb-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                      Flash Sale • {activeFlashSale.discountPercent}%
                    </div>
                  )}
                  {showOriginal && (
                    <div className="text-xs text-gray-400 line-through">Rp {formatIDR(referenceOriginal!)}</div>
                  )}
                  <div className="mt-1 text-lg font-semibold text-indigo-600">Rp {formatIDR(salePrice)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
