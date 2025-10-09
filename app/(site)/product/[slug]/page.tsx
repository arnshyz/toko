import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { getCategoryDataset } from "@/lib/categories";
import { ProductPurchaseOptions } from "@/components/ProductPurchaseOptions";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { VariantGroup } from "@/types/product";
import {
  getPrimaryProductImageSrc,
  getProductImageSources,
} from "@/lib/productImages";
import { getSession } from "@/lib/session";
import { ReviewHelpfulButton } from "@/components/ReviewHelpfulButton";
import {
  calculateFlashSalePrice,
  formatFlashSaleWindow,
  getActiveFlashSale,
  getNextFlashSale,
} from "@/lib/flash-sale";
import { formatJakartaDate, formatRelativeTimeFromNow } from "@/lib/time";
import { resolveStoreBadgeStyle } from "@/lib/store-badges";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatJoinedSince(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const days = Math.floor(diff / oneDay);
  if (days <= 0) return "Baru bergabung";
  const years = Math.floor(days / 365);
  if (years >= 1) return `${years} tahun lalu`;
  const months = Math.floor(days / 30);
  if (months >= 1) return `${months} bulan lalu`;
  return `${days} hari lalu`;
}

function ensureVariantGroups(value: unknown): VariantGroup[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = "name" in item ? String((item as any).name ?? "") : "";
      const optionsRaw = "options" in item ? (item as any).options : [];
      const options = Array.isArray(optionsRaw)
        ? optionsRaw.map((option) => String(option)).filter(Boolean)
        : [];

      if (!name || options.length === 0) return null;
      return { name, options } satisfies VariantGroup;
    })
    .filter((group): group is VariantGroup => Boolean(group));
}

function renderStars(value: number) {
  const stars = Math.round(value);
  return "★★★★★".split("").map((star, index) => (
    <span key={index} className={index < stars ? "text-sky-500" : "text-gray-300"}>
      ★
    </span>
  ));
}

function formatRelativeTime(value: Date) {
  const now = new Date();
  const diff = now.getTime() - value.getTime();
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diff < minute) return "Baru saja";
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} menit lalu`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} jam lalu`;
  }
  if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} hari lalu`;
  }
  if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} minggu lalu`;
  }
  if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months} bulan lalu`;
  }

  const years = Math.floor(diff / year);
  return `${years} tahun lalu`;
}

function formatReviewDateTime(value: Date) {
  return formatJakartaDate(value, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HERO_PLACEHOLDER = "https://placehold.co/900x600?text=Produk";
const THUMB_PLACEHOLDER = "https://placehold.co/300x200?text=Preview";

type IconProps = { className?: string };

function IconChevronLeft({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShare({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8 12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShoppingCart({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path
        d="M4 6h2l1.2 9.6A2 2 0 0 0 9.18 17h7.64a2 2 0 0 0 1.98-1.4L20 8H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  );
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const sessionPromise = getSession();
  const now = new Date();

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      seller: true,
      warehouse: true,
      _count: { select: { orderItems: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true } },
      flashSales: {
        where: { endAt: { gte: now } },
        orderBy: { startAt: "asc" },
      },
    },
  });

  if (!product) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-600">
        Produk tidak ditemukan.
      </div>
    );
  }

  const session = await sessionPromise;
  const currentUserId = session.user?.id ?? null;

  const categoryDataset = await getCategoryDataset();
  const categoryInfoMap = categoryDataset.infoBySlug;

  const [
    siblingProducts,
    recommendedProducts,
    reviewAggregate,
    productReviews,
    likedReviewRows,
  ] = await Promise.all([
    prisma.product.findMany({
      where: {
        sellerId: product.sellerId,
        isActive: true,
        NOT: { id: product.id },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, select: { id: true } } },
    }),
    prisma.product.findMany({
      where: {
        category: product.category,
        isActive: true,
        NOT: { id: product.id },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, select: { id: true } } },
    }),
    prisma.orderReview.aggregate({
      where: {
        order: {
          items: {
            some: {
              productId: product.id,
            },
          },
        },
      },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.orderReview.findMany({
      where: {
        order: {
          items: {
            some: {
              productId: product.id,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        order: {
          select: {
            orderCode: true,
            createdAt: true,
            items: {
              where: { productId: product.id },
              select: {
                id: true,
                qty: true,
              },
            },
          },
        },
        _count: { select: { helpfulVotes: true } },
      },
    }),
    currentUserId
      ? prisma.orderReviewHelpful.findMany({
          where: {
            userId: currentUserId,
            review: {
              order: {
                items: {
                  some: {
                    productId: product.id,
                  },
                },
              },
            },
          },
          select: { reviewId: true },
        })
      : Promise.resolve([] as { reviewId: string }[]),
  ]);

  const likedReviewIds = new Set(likedReviewRows.map((row) => row.reviewId));

  const buyerIds = Array.from(
    new Set(
      productReviews
        .map((review) => review.buyerId)
        .filter((buyerId): buyerId is string => typeof buyerId === "string" && buyerId.length > 0)
    )
  );
  const verifiedBuyerRows = buyerIds.length
    ? ((await prisma.user.findMany({
        where: { id: { in: buyerIds } },
        select: { id: true, isVerified: true },
      } as any)) as { id: string; isVerified?: boolean | null }[])
    : [];
  const verifiedBuyerIds = new Set(
    verifiedBuyerRows.filter((row) => row.isVerified).map((row) => row.id)
  );

  const category = categoryInfoMap.get(product.category);
  const originalPrice = typeof product.originalPrice === "number" ? product.originalPrice : null;
  const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
  const nextFlashSale = getNextFlashSale(product.flashSales ?? [], now);
  const basePrice = product.price;
  const salePrice = activeFlashSale
    ? calculateFlashSalePrice(basePrice, activeFlashSale)
    : basePrice;
  const referenceOriginal = activeFlashSale
    ? originalPrice && originalPrice > basePrice
      ? originalPrice
      : basePrice
    : originalPrice;
  const showOriginal = referenceOriginal !== null && referenceOriginal > salePrice;
  const categoryLabel = category?.name ?? product.category.replace(/-/g, " ");
  const categoryEmoji = category?.emoji ?? "🏷️";
  const discountPercent = activeFlashSale
    ? activeFlashSale.discountPercent
    : showOriginal && referenceOriginal
    ? Math.max(1, Math.round(((referenceOriginal - salePrice) / referenceOriginal) * 100))
    : null;

  const variantGroups = ensureVariantGroups(product.variantOptions ?? undefined);
  const displayVariantGroups: VariantGroup[] = variantGroups.length > 0
    ? variantGroups
    : [{ name: "Varian", options: ["Standar"] }];
  const primaryImage = getPrimaryProductImageSrc(product);

  const seller = product.seller;
  const sellerRecord = seller as typeof seller & {
    isVerified?: boolean | null;
    lastActiveAt?: Date | null;
  };
  const badge = resolveStoreBadgeStyle(seller.storeBadge);
  const isOnline = seller.storeIsOnline ?? false;
  const lastActiveMessage = formatRelativeTimeFromNow(sellerRecord.lastActiveAt ?? null);
  const activityLabel = isOnline
    ? "Sedang online sekarang"
    : lastActiveMessage
    ? `Aktif ${lastActiveMessage}`
    : "Aktivitas terakhir belum tersedia";
  const followers = seller.storeFollowers ?? 0;
  const following = seller.storeFollowing ?? 0;
  const storeRatingValue = seller.storeRating ?? 0;
  const storeRatingCount = seller.storeRatingCount ?? 0;
  const storeRatingLabel = storeRatingCount > 0
    ? `${storeRatingValue.toFixed(1)} dari ${storeRatingCount} penilaian`
    : "Belum ada penilaian";

  const ratingValue = reviewAggregate._avg.rating ?? 0;
  const ratingCount = reviewAggregate._count.rating ?? 0;

  const soldCount = product._count?.orderItems ?? 0;
  const totalSellerProducts = siblingProducts.length + 1;
  const sellerVerified = Boolean(sellerRecord.isVerified);
  const favoriteEstimate = Math.max(18, Math.round(salePrice / 50000));
  const specifications: { label: string; value: string }[] = [
    { label: "Kategori", value: `${categoryEmoji} ${categoryLabel}` },
    { label: "Stok", value: `${product.stock} unit` },
    {
      label: "Gudang",
      value: product.warehouse
        ? `${product.warehouse.name}${product.warehouse.city ? `, ${product.warehouse.city}` : ""}`
        : "-",
    },
    { label: "Harga", value: `Rp ${formatIDR(salePrice)}` },
    {
      label: "Harga Coret",
      value: showOriginal && referenceOriginal ? `Rp ${formatIDR(referenceOriginal)}` : "-",
    },
    {
      label: "Diposting",
      value: formatJakartaDate(product.createdAt, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  const highlightServices = [
    {
      title: "Garansi",
      description: "Garansi toko 7 hari: barang dapat dikembalikan jika tidak sesuai.",
    },
    {
      title: "Pengiriman",
      description: product.warehouse?.city
        ? `Dikirim dari ${product.warehouse.city}. Estimasi tiba 2-4 hari kerja.`
        : "Pengiriman nasional dengan estimasi 2-5 hari kerja.",
    },
    {
      title: "Layanan",
      description: isOnline
        ? "Toko sedang online dan siap merespons pesanan Anda."
        : lastActiveMessage
        ? `Toko sedang offline. Aktif ${lastActiveMessage}.`
        : "Toko akan memproses pesanan segera setelah kembali online.",
    },
  ];

  const productImageSources = getProductImageSources(product.id, product.images ?? []);
  const heroImageSrc = productImageSources[0]?.src ?? product.imageUrl ?? HERO_PLACEHOLDER;
  const thumbnailImages = (
    productImageSources.length > 0
      ? productImageSources
      : [{ id: "placeholder", src: product.imageUrl ?? THUMB_PLACEHOLDER }]
  ).slice(0, 5);

  return (
    <div className="space-y-10 pb-36 lg:pb-0">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="lg:p-4">
              <img
                src={heroImageSrc}
                alt={product.title}
                className="aspect-[3/4] w-full object-cover lg:aspect-[4/3] lg:rounded-xl"
              />
            </div>
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white lg:hidden">
              <Link href="/" aria-label="Kembali">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur">
                  <IconChevronLeft className="h-5 w-5" />
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur"
                  aria-label="Bagikan produk"
                >
                  <IconShare className="h-5 w-5" />
                </button>
                <Link
                  href="/cart"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur"
                  aria-label="Lihat keranjang"
                >
                  <IconShoppingCart className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:hidden">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-sky-600">Rp {formatIDR(salePrice)}</div>
                {showOriginal && referenceOriginal ? (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-gray-400 line-through">Rp {formatIDR(referenceOriginal)}</span>
                    {discountPercent ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-600">
                        -{discountPercent}%
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {soldCount > 0 ? `${formatCompactNumber(soldCount)} terjual` : "Belum ada penjualan"}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{product.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-0.5 text-base">{renderStars(ratingValue)}</span>
                {ratingValue.toFixed(1)}
              </span>
              <span>({formatCompactNumber(Math.max(ratingCount, 0))} penilaian)</span>
              <span>•</span>
              <span>{formatCompactNumber(favoriteEstimate)} favorit</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible xl:grid-cols-5">
            {thumbnailImages.map((image, index) => (
              <div
                key={image.id}
                className="flex h-20 min-w-[80px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white"
              >
                <img
                  src={image.src}
                  alt={`Preview ${index + 1} dari ${product.title}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Keunggulan Produk</h2>
            <dl className="mt-4 grid gap-4 text-sm text-gray-600 md:grid-cols-3">
              {highlightServices.map((item) => (
                <div key={item.title} className="space-y-1">
                  <dt className="font-semibold text-gray-700">{item.title}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <nav className="hidden flex-wrap items-center gap-2 text-xs text-gray-500 lg:flex">
              <Link href="/" className="hover:text-sky-500">
                Beranda
              </Link>
              <span>/</span>
              <span>Handphone &amp; Aksesoris</span>
              <span>/</span>
              <span className="capitalize">{categoryLabel}</span>
            </nav>

            <div className="hidden space-y-2 lg:block">
              <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="flex items-center gap-0.5 text-base">{renderStars(ratingValue)}</span>
                  <span className="font-semibold text-gray-700">{ratingValue.toFixed(1)}</span>
                </span>
                <span>({formatCompactNumber(Math.max(ratingCount, 0))} penilaian)</span>
                <span>•</span>
                <span>{soldCount > 0 ? `${formatCompactNumber(soldCount)} terjual` : "Belum ada penjualan"}</span>
                <span>•</span>
                <span>{formatCompactNumber(favoriteEstimate)} favorit</span>
              </div>
            </div>

            <div className="hidden space-y-3 rounded-xl bg-sky-50 p-5 lg:block">
              <div className="flex flex-wrap items-end gap-4">
                <div className="text-3xl font-semibold text-sky-600">Rp {formatIDR(salePrice)}</div>
                {showOriginal && referenceOriginal && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="line-through">Rp {formatIDR(referenceOriginal)}</span>
                    {discountPercent && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-600">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {activeFlashSale ? (
                <div className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-sky-600">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                    Flash Sale
                  </span>
                  <span>
                    Berakhir{' '}
                    {formatJakartaDate(activeFlashSale.endAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ) : nextFlashSale ? (
                <div className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-sky-500">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                    Flash Sale
                  </span>
                  <span>Jadwal berikutnya: {formatFlashSaleWindow(nextFlashSale)}</span>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-700">Pengiriman</span>
                    <span>
                      {product.warehouse?.city
                        ? `Dikirim dari ${product.warehouse.city}`
                        : "Pengiriman nasional"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-700">Garansi</span>
                    <span>Garansi toko resmi 7 hari</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-700">Pembayaran</span>
                    <span>C.O.D &amp; Transfer Bank</span>
                  </div>
                </div>
                <ProductPurchaseOptions
                  variantGroups={displayVariantGroups}
                  showSingleVariantNotice={variantGroups.length === 0}
                  productId={product.id}
                  title={product.title}
                  price={salePrice}
                  sellerId={product.sellerId}
                  stock={product.stock}
                  imageUrl={primaryImage}
                  isLoggedIn={Boolean(currentUserId)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  {seller.avatarUrl?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seller.avatarUrl}
                      alt={`Foto ${seller.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-600">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
                    <span className="flex items-center gap-1">
                      <span>{seller.name}</span>
                      {sellerVerified ? <VerifiedBadge size={16} /> : null}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full text-[11px] font-semibold ${
                        badge.imageSrc ? "" : "px-2 py-0.5"
                      } ${badge.className}`}
                    >
                      {badge.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={badge.imageSrc}
                          alt={badge.label}
                          className={badge.imageClassName ?? "h-4 w-auto"}
                        />
                      ) : (
                        badge.label
                      )}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        isOnline ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Produk: {formatCompactNumber(totalSellerProducts)}</span>
                    <span>Pengikut: {formatCompactNumber(followers)}</span>
                    <span>Mengikuti: {formatCompactNumber(following)}</span>
                    <span>Penilaian: {storeRatingLabel}</span>
                    <span>Bergabung: {formatJoinedSince(seller.createdAt)}</span>
                    <span>{activityLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/s/${seller.slug}`}
                  className="rounded-full border border-sky-500 px-5 py-2 text-center text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
                >
                  Kunjungi Toko
                </Link>
                <button className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-600">
                  Ikuti
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Spesifikasi Produk</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm text-gray-600 md:grid-cols-2">
          {specifications.map((item) => (
            <div key={item.label} className="flex">
              <dt className="w-40 font-medium text-gray-500">{item.label}</dt>
              <dd className="flex-1 text-gray-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Deskripsi Produk</h2>
        <div className="prose prose-sm mt-4 max-w-none text-gray-700">
          {product.description ? (
            product.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph.trim()}
              </p>
            ))
          ) : (
            <p>Penjual belum menambahkan deskripsi rinci untuk produk ini.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Penilaian Pembeli</h2>
            <p className="text-sm text-gray-500">Lihat apa kata pembeli lain mengenai produk ini.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Semua", "5 Bintang", "4 Bintang", "3 Bintang", "Dengan Media", "Dengan Komentar"].map((filter) => (
              <button
                key={filter}
                className={`rounded-full border px-3 py-1 font-medium transition ${
                  filter === "Semua"
                    ? "border-sky-500 bg-sky-50 text-sky-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-sky-50 p-5 text-center">
            <div className="text-4xl font-semibold text-sky-500">{ratingValue.toFixed(1)}</div>
            <div className="mt-2 flex items-center justify-center gap-1 text-lg text-sky-500">
              {renderStars(ratingValue)}
            </div>
            <div className="mt-1 text-xs text-gray-600">{ratingCount} penilaian</div>
          </div>
          <div className="space-y-6">
            {productReviews.length > 0 ? (
              <div className="space-y-4">
                {productReviews.map((review) => {
                  const reviewWithRelations = review as typeof review & {
                    buyer: { name: string; avatarUrl: string | null };
                    order: { items: { id: string; qty: number }[] };
                    _count: { helpfulVotes?: number | null };
                  };
                  const buyerRecord = reviewWithRelations.buyer;
                  const buyerName = buyerRecord.name.trim() || "Pembeli";
                  const buyerVerified = verifiedBuyerIds.has(review.buyerId);
                  const firstItem = reviewWithRelations.order.items[0];
                  const purchaseInfo = firstItem
                    ? `${firstItem.qty} barang dibeli`
                    : "Pesanan diverifikasi";
                  const helpfulCount = reviewWithRelations._count.helpfulVotes ?? 0;
                  const likedByCurrentUser = likedReviewIds.has(review.id);
                  const isOwnReview = currentUserId ? review.buyerId === currentUserId : false;

                  return (
                    <article key={review.id} className="space-y-3 rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <span>{buyerName}</span>
                            {buyerVerified ? <VerifiedBadge size={14} /> : null}
                          </span>
                          <span className="flex gap-0.5 text-sky-500">{renderStars(review.rating)}</span>
                        </div>
                        <span>{formatRelativeTime(review.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-sky-600">
                        <span>Diulas pada {formatReviewDateTime(review.createdAt)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sky-500">{purchaseInfo}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {review.comment?.trim() || "Pembeli tidak meninggalkan komentar."}
                      </p>
                      <ReviewHelpfulButton
                        reviewId={review.id}
                        initialCount={helpfulCount}
                        initialLiked={likedByCurrentUser}
                        isAuthenticated={Boolean(currentUserId)}
                        isOwnReview={isOwnReview}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada penilaian untuk produk ini. Jadilah pembeli pertama yang memberikan ulasan!
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Produk Lain dari Toko Ini</h2>
          <Link href={`/s/${seller.slug}`} className="text-sm font-semibold text-sky-600 hover:underline">
            Lihat Semua
          </Link>
        </div>
        {siblingProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Toko belum memiliki produk lain.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {siblingProducts.map((item) => {
              const siblingCategory = categoryInfoMap.get(item.category);
              const siblingLabel = siblingCategory?.name ?? item.category.replace(/-/g, " ");
              const siblingEmoji = siblingCategory?.emoji ?? "🏷️";
              const siblingOriginal = typeof item.originalPrice === "number" ? item.originalPrice : null;
              const siblingShowOriginal = siblingOriginal !== null && siblingOriginal > item.price;

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={getPrimaryProductImageSrc(item)}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <span>{siblingEmoji}</span>
                      <span className="capitalize">{siblingLabel}</span>
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold text-gray-800">{item.title}</div>
                    {siblingShowOriginal && (
                      <div className="text-xs text-gray-400 line-through">Rp {formatIDR(siblingOriginal)}</div>
                    )}
                    <div className="text-lg font-semibold text-sky-500">Rp {formatIDR(item.price)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Rekomendasi Untukmu</h2>
          <Link href="/" className="text-sm font-semibold text-sky-600 hover:underline">
            Lihat Lainnya
          </Link>
        </div>
        {recommendedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Belum ada rekomendasi serupa.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {recommendedProducts.map((item) => {
              const recommendationCategory = categoryInfoMap.get(item.category);
              const recommendationLabel = recommendationCategory?.name ?? item.category.replace(/-/g, " ");
              const recommendationEmoji = recommendationCategory?.emoji ?? "🏷️";
              const recOriginal = typeof item.originalPrice === "number" ? item.originalPrice : null;
              const recShowOriginal = recOriginal !== null && recOriginal > item.price;

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={getPrimaryProductImageSrc(item)}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <span>{recommendationEmoji}</span>
                      <span className="capitalize">{recommendationLabel}</span>
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold text-gray-800">{item.title}</div>
                    {recShowOriginal && (
                      <div className="text-xs text-gray-400 line-through">Rp {formatIDR(recOriginal)}</div>
                    )}
                    <div className="text-lg font-semibold text-sky-500">Rp {formatIDR(item.price)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
