export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { formatIDR } from "@/lib/utils";
import { PromoSlider, PromoSlide } from "@/components/PromoSlider";
import { ActiveVoucherPopup } from "@/components/ActiveVoucherPopup";
import { ClaimVoucherButton } from "@/components/ClaimVoucherButton";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { SalesProofTicker } from "@/components/SalesProofTicker";
import { FlashSaleRail } from "@/components/FlashSaleRail";
import { ProductCard, type ProductCardProps } from "@/components/ProductCard";
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

const quickActions = [
  {
    icon: "💡",
    label: "Pulsa & Data",
    description: "Isi ulang instan dan hemat",
    href: "/promo",
  },
  {
    icon: "🎟️",
    label: "Voucher Digital",
    description: "Raih penawaran eksklusif",
    href: "/voucher",
  },
  {
    icon: "🔥",
    label: "Flash Sale",
    description: "Pantau harga tercepat",
    href: "#flash-sale",
  },
  {
    icon: "🛠️",
    label: "Jasa Profesional",
    description: "Temukan tim ahli terbaik",
    href: "/categories",
  },
  {
    icon: "📦",
    label: "Pesanan",
    description: "Lacak progres layanan",
    href: "/orders",
  },
  {
    icon: "🛒",
    label: "Keranjang",
    description: "Selesaikan belanja Anda",
    href: "/cart",
  },
  {
    icon: "🎧",
    label: "Bantuan",
    description: "Hubungi tim support",
    href: "/help",
  },
  {
    icon: "🏪",
    label: "Seller Center",
    description: "Kelola etalase Anda",
    href: "/seller",
  },
];

const curatedCollections = [
  {
    title: "Creative Studio",
    description: "Logo, branding kit, dan desain UI elegan dari kreator pilihan.",
    href: "/categories/design",
    accent: "from-rose-500/40 via-fuchsia-500/30 to-indigo-500/40",
  },
  {
    title: "Marketing Accelerator",
    description: "Optimalkan campaign Anda dengan paket ads & content marketing.",
    href: "/categories/marketing",
    accent: "from-emerald-500/40 via-teal-500/30 to-sky-500/40",
  },
  {
    title: "Tech & Development",
    description: "Landing page, aplikasi mobile, dan automasi bisnis siap pakai.",
    href: "/categories/development",
    accent: "from-indigo-500/40 via-blue-500/30 to-purple-500/40",
  },
];

const placeholderFlashSales: Array<{
  id: string;
  slug: string;
  title: string;
  sellerName: string;
  sellerSlug: string;
  salePrice: number;
  originalPrice: number | null;
  discountPercent: number;
  imageUrl: string;
  endsAt: string;
  stock: number;
}> = [
  {
    id: "placeholder-flash-1",
    slug: "starter-branding-kit",
    title: "Starter Branding Kit",
    sellerName: "Visual Artisan",
    sellerSlug: "visual-artisan",
    salePrice: 280000,
    originalPrice: 420000,
    discountPercent: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80",
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    stock: 25,
  },
  {
    id: "placeholder-flash-2",
    slug: "growth-marketing-lab",
    title: "Growth Marketing Lab",
    sellerName: "Growthify Studio",
    sellerSlug: "growthify-studio",
    salePrice: 450000,
    originalPrice: 600000,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    stock: 40,
  },
];

const placeholderProductCards: ProductCardProps[] = [
  {
    href: "/product/starter-branding-kit",
    title: "Starter Branding Kit",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    salePrice: 350000,
    basePrice: 420000,
    originalPrice: 420000,
    ratingAverage: 4.8,
    ratingCount: 128,
    soldCount: 245,
    storeBadge: "GOLD",
    discountPercent: 20,
    className: "bg-white/95 backdrop-blur",
  },
  {
    href: "/product/ux-audit",
    title: "UX Audit & Persona Lab",
    imageUrl: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80",
    salePrice: 290000,
    basePrice: 320000,
    originalPrice: 360000,
    ratingAverage: 4.6,
    ratingCount: 98,
    soldCount: 180,
    storeBadge: "SILVER",
    discountPercent: 15,
    className: "bg-white/95 backdrop-blur",
  },
  {
    href: "/product/performance-ads-kit",
    title: "Performance Ads Kit",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80",
    salePrice: 520000,
    basePrice: 580000,
    originalPrice: 640000,
    ratingAverage: 4.9,
    ratingCount: 210,
    soldCount: 320,
    storeBadge: "PLATINUM",
    discountPercent: 18,
    className: "bg-white/95 backdrop-blur",
  },
  {
    href: "/product/mobile-app-sprint",
    title: "Mobile App Sprint",
    imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    salePrice: 780000,
    basePrice: 820000,
    originalPrice: 920000,
    ratingAverage: 4.7,
    ratingCount: 164,
    soldCount: 96,
    storeBadge: "GOLD",
    discountPercent: 15,
    className: "bg-white/95 backdrop-blur",
  },
];

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    seller: true;
    images: { select: { id: true } };
    flashSales: true;
    _count: { select: { orderItems: true } };
  };
}>;

export default async function HomePage() {
  const now = new Date();

  let products: ProductWithRelations[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        seller: true,
        images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
        flashSales: {
          where: { endAt: { gte: now } },
          orderBy: { startAt: "asc" },
        },
        _count: { select: { orderItems: true } },
      },
    });
  } catch (error) {
    console.error("Failed to load products", error);
  }

  let ratingSummary = new Map<string, { average: number; count: number }>();
  if (products.length > 0) {
    try {
      ratingSummary = await getProductRatingSummary(products.map((product) => product.id));
    } catch (error) {
      console.error("Failed to load rating summary", error);
    }
  }

  let promoBanners: Awaited<ReturnType<typeof prisma.promoBanner.findMany>> = [];
  try {
    promoBanners = await prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });
  } catch (error) {
    console.error("Failed to load promo banners", error);
  }

  let activeVouchers: Awaited<ReturnType<typeof prisma.voucher.findMany>> = [];
  try {
    activeVouchers = await prisma.voucher.findMany({
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
  } catch (error) {
    console.error("Failed to load vouchers", error);
  }
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
      const originalReference =
        product.originalPrice && product.originalPrice > product.price
          ? product.originalPrice
          : product.price;
      const originalPrice = originalReference > salePrice ? originalReference : null;

      return {
        id: product.id,
        slug: product.slug,
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
  const flashSaleItems = flashSaleProducts.length > 0 ? flashSaleProducts : placeholderFlashSales;

  const productCardItems: ProductCardProps[] =
    products.length > 0
      ? products.map((product) => {
          const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
          const salePrice = activeFlashSale
            ? calculateFlashSalePrice(product.price, activeFlashSale)
            : product.price;
          const rating = ratingSummary.get(product.id);
          const soldCount = product._count?.orderItems ?? 0;

          const card: ProductCardProps = {
            href: `/product/${product.slug}`,
            title: product.title,
            imageUrl: getPrimaryProductImageSrc(product),
            salePrice,
            basePrice: product.price,
            originalPrice: product.originalPrice,
            ratingAverage: rating?.average ?? 0,
            ratingCount: rating?.count ?? 0,
            soldCount,
            storeBadge: product.seller.storeBadge,
            discountPercent: activeFlashSale?.discountPercent ?? null,
            className: "bg-white/95 backdrop-blur",
          };

          return card;
        })
      : placeholderProductCards;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(76,29,149,0.28),_rgba(15,23,42,0.95))]"></div>
      <div className="absolute -left-24 top-[-6rem] -z-10 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl md:h-96 md:w-96"></div>
      <div className="absolute bottom-[-8rem] right-[-4rem] -z-10 h-80 w-80 rounded-full bg-pink-500/30 blur-3xl md:h-[28rem] md:w-[28rem]"></div>

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

      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-24 pt-8 text-slate-100 md:px-8">
        <header className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/20 via-white/5 to-white/0 p-6 shadow-[0_40px_120px_-60px_rgba(14,165,233,0.7)] backdrop-blur-3xl md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                    Selamat Datang di Toko.id
                  </p>
                  <h1 className="mt-2 bg-gradient-to-r from-white via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
                    Jelajahi layanan digital dengan nuansa iOS glassmorphism.
                  </h1>
                </div>
                <Link
                  href="/account"
                  className="hidden items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-sky-500/80 to-indigo-500/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_-20px_rgba(59,130,246,0.9)] transition hover:from-sky-400 hover:to-indigo-400 md:inline-flex"
                >
                  Profilku ↗
                </Link>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Temukan kurasi terbaik untuk mengembangkan bisnis digital Anda. Akses cepat, promo eksklusif, dan layanan profesional tersedia dalam satu layar bergaya iOS.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/search"
                  className="group flex items-center justify-between rounded-3xl border border-white/10 bg-gradient-to-r from-white/25 via-white/15 to-transparent px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_-30px_rgba(56,189,248,0.8)] backdrop-blur-2xl transition hover:border-white/40 hover:from-white/40 hover:via-white/25"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">🔍</span>
                    Cari kebutuhanmu
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition group-hover:border-white/40 group-hover:text-white">
                    ⌘K
                  </span>
                </Link>
                <Link
                  href="/notifications"
                  className="group flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/40 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-35px_rgba(236,72,153,0.8)] backdrop-blur-2xl transition hover:border-white/40 hover:bg-slate-900/60"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    Promo & update baru
                  </span>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition group-hover:bg-emerald-400/30">
                    3 baru
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-slate-950/40 p-6 shadow-[0_35px_80px_-55px_rgba(14,116,144,0.9)] backdrop-blur-2xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                    Voucher Pilihan
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {highlightedVoucher ? highlightedVoucher.code : "Diskon Spesial"}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-white/75">
                    {highlightedVoucher
                      ? `Potongan hingga Rp ${formatIDR(highlightedVoucher.value)} untuk transaksi pilihan hari ini.`
                      : "Nikmati penawaran terbaik dan cashback eksklusif di layanan digital favorit Anda."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {highlightedVoucher ? (
                    <ClaimVoucherButton
                      voucherId={highlightedVoucher.id}
                      voucherCode={highlightedVoucher.code}
                      size="sm"
                      color="salmon"
                      className="rounded-full bg-gradient-to-r from-[#f53d2d] to-amber-400 text-sm font-semibold shadow-[0_25px_50px_-30px_rgba(245,61,45,0.8)] transition hover:from-[#ff5640] hover:to-amber-300"
                    >
                      Klaim Sekarang
                    </ClaimVoucherButton>
                  ) : (
                    <Link
                      href="/promo"
                      className="rounded-full bg-gradient-to-r from-rose-500/90 to-orange-400/90 px-5 py-2 text-sm font-semibold text-white shadow-[0_25px_50px_-30px_rgba(255,82,82,0.8)] transition hover:from-rose-500 hover:to-orange-300"
                    >
                      Jelajahi Promo
                    </Link>
                  )}
                  <Link
                    href="/voucher"
                    className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:inline-flex"
                  >
                    Voucher Lainnya
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-transparent p-1 shadow-[0_45px_120px_-65px_rgba(99,102,241,0.9)] backdrop-blur-3xl">
            <PromoSlider
              slides={slides.length > 0 ? slides : fallbackSlides}
              className="h-full rounded-[28px] bg-gradient-to-br from-indigo-500/80 via-violet-500/70 to-fuchsia-500/70"
            />
          </div>
        </header>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
              Akses Cepat
            </h2>
            <Link
              href="/sitemap"
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Jelajahi seluruh menu ↗
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/10 p-4 text-left shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-white/40 hover:bg-white/20"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="mt-6 space-y-2">
                  <p className="text-base font-semibold text-white">{action.label}</p>
                  <p className="text-xs text-white/70">{action.description}</p>
                </div>
                <span className="mt-6 text-sm font-semibold text-white/60 transition group-hover:text-white">Mulai ↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {curatedCollections.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-7 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.8)] backdrop-blur-2xl transition hover:border-white/40 hover:bg-white/15`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${collection.accent} opacity-60 transition duration-500 group-hover:opacity-80`}
              ></div>
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <span className="inline-flex w-fit items-center rounded-full border border-white/40 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                    Kurasi
                  </span>
                  <h3 className="text-2xl font-semibold text-white">{collection.title}</h3>
                  <p className="text-sm text-white/75">{collection.description}</p>
                </div>
                <span className="text-sm font-semibold text-white/70 transition group-hover:text-white">Lihat Koleksi ↗</span>
              </div>
            </Link>
          ))}
        </section>

        <section id="flash-sale" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
              Flash Sale Hari Ini
            </h2>
            <p className="text-sm text-white/60">
              Dapatkan potongan terbaik dalam hitungan menit.
            </p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/80 p-6 text-gray-900 shadow-[0_40px_90px_-60px_rgba(249,115,22,0.7)] backdrop-blur-xl">
            <FlashSaleRail items={flashSaleItems} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
              Produk Terbaru
            </h2>
            <Link
              href="/product"
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Lihat semua produk ↗
            </Link>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/80 p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.7)] backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productCardItems.map((card) => (
                <ProductCard key={card.href} {...card} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
