export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { PromoSlider, PromoSlide } from "@/components/PromoSlider";
import { ActiveVoucherPopup } from "@/components/ActiveVoucherPopup";
import { ClaimVoucherButton } from "@/components/ClaimVoucherButton";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { SalesProofTicker } from "@/components/SalesProofTicker";
import { FlashSaleRail } from "@/components/FlashSaleRail";
import { ProductCard } from "@/components/ProductCard";
import { getProductRatingSummary } from "@/lib/product-ratings";

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
      _count: { select: { orderItems: true } },
    }
  });
  const ratingSummary = await getProductRatingSummary(products.map((product) => product.id));
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
        <div className="rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/70 px-4 py-4 text-gray-900 shadow-xl shadow-[0_20px_50px_rgba(75,83,32,0.1)] ring-1 ring-white/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Voucher Pilihan</p>
              <p className="text-lg font-semibold text-primary">
                {highlightedVoucher ? highlightedVoucher.code : "Diskon Spesial"}
              </p>
              <p className="text-xs text-gray-500">
                {highlightedVoucher
                  ? `Potongan hingga Rp ${formatIDR(highlightedVoucher.value)}`
                  : "Nikmati penawaran terbaik setiap hari"}
              </p>
            </div>
            {highlightedVoucher ? (
              <ClaimVoucherButton
                voucherId={highlightedVoucher.id}
                voucherCode={highlightedVoucher.code}
                size="sm"
                color="primary"
                className="shadow"
              >
                Klaim
              </ClaimVoucherButton>
            ) : (
              <Link
                href="/promo"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow"
              >
                Jelajahi
              </Link>
            )}
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
          {products.map((product) => {
            const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
            const salePrice = activeFlashSale
              ? calculateFlashSalePrice(product.price, activeFlashSale)
              : product.price;
            const rating = ratingSummary.get(product.id);
            const soldCount = product._count?.orderItems ?? 0;

            return (
              <ProductCard
                key={product.id}
                href={`/product/${product.id}`}
                title={product.title}
                imageUrl={getPrimaryProductImageSrc(product)}
                salePrice={salePrice}
                basePrice={product.price}
                originalPrice={product.originalPrice}
                ratingAverage={rating?.average ?? 0}
                ratingCount={rating?.count ?? 0}
                soldCount={soldCount}
                storeBadge={product.seller.storeBadge}
                discountPercent={activeFlashSale?.discountPercent ?? null}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
