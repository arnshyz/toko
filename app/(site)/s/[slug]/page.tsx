import { prisma } from "@/lib/prisma";
import { getCategoryDataset } from "@/lib/categories";
import { formatIDR } from "@/lib/utils";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
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

export default async function Storefront({ params }: { params: { slug: string } }) {
  const seller = await prisma.user.findUnique({ where: { slug: params.slug } });
  if (!seller) return <div>Toko tidak ditemukan</div>;

  const now = new Date();
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
      flashSales: {
        where: { endAt: { gte: now } },
        orderBy: { startAt: "asc" },
      },
    },
  });

  const categoryDataset = await getCategoryDataset();
  const categoryInfoMap = categoryDataset.infoBySlug;

  const badge = resolveStoreBadgeStyle(seller.storeBadge);
  const isOnline = seller.storeIsOnline ?? false;
  const followers = seller.storeFollowers ?? 0;
  const following = seller.storeFollowing ?? 0;
  const ratingValue = seller.storeRating ?? 0;
  const ratingCount = seller.storeRatingCount ?? 0;
  const ratingLabel = ratingCount > 0
    ? `${ratingValue.toFixed(1)} (${formatCompactNumber(ratingCount)} penilaian)`
    : "Belum ada penilaian";
  const joinedLabel = formatJoinedSince(seller.createdAt);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-start md:justify-between md:p-6">
          <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
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
              <span
                className={`inline-flex items-center rounded-full text-xs font-medium ${
                  badge.imageSrc ? "" : "px-3 py-1"
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
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    {seller.name}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${isOnline ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">@{seller.slug}</div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <button className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 sm:w-auto">
                    Ikuti
                  </button>
                  <button className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 sm:w-auto">
                    Chat
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-xs text-gray-600 sm:grid-cols-3 sm:text-sm lg:grid-cols-5">
                <div>
                  <dt className="font-medium text-gray-500">Produk</dt>
                  <dd className="text-base font-semibold text-gray-900">{products.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Pengikut</dt>
                  <dd className="text-base font-semibold text-gray-900">{formatCompactNumber(followers)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mengikuti</dt>
                  <dd className="text-base font-semibold text-gray-900">{formatCompactNumber(following)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Penilaian</dt>
                  <dd className="text-base font-semibold text-gray-900">{ratingLabel}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Bergabung</dt>
                  <dd className="text-base font-semibold text-gray-900">{joinedLabel}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50">
          <nav className="flex items-center gap-6 overflow-x-auto px-6 py-3 text-sm font-medium text-gray-600">
            <a className="text-sky-500">Halaman Utama</a>
            <a className="hover:text-sky-500">Produk</a>
            <a className="hover:text-sky-500">Sandal Pria</a>
            <a className="hover:text-sky-500">Sandal Jepit</a>
            <a className="hover:text-sky-500">Sandal Wanita</a>
            <a className="hover:text-sky-500">Sandal Unisex</a>
            <a className="hover:text-sky-500">Lainnya</a>
          </nav>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Produk Unggulan</h2>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Toko ini belum memiliki produk aktif.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const category = categoryInfoMap.get(p.category);
              const categoryLabel = category?.name ?? p.category.replace(/-/g, " ");
              const categoryEmoji = category?.emoji ?? "🏷️";
              const originalPrice = typeof p.originalPrice === "number" ? p.originalPrice : null;
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

              return (
                <a
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={getPrimaryProductImageSrc(p)}
                    alt={p.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="inline-flex w-fit items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <span>{categoryEmoji}</span>
                      <span className="capitalize">{categoryLabel}</span>
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold text-gray-800">{p.title}</div>
                    {activeFlashSale && (
                      <div className="inline-flex w-fit items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        Flash Sale • {activeFlashSale.discountPercent}%
                      </div>
                    )}
                    {showOriginal && (
                      <div className="text-xs text-gray-400 line-through">Rp {formatIDR(referenceOriginal!)}</div>
                    )}
                    <div className="mt-auto text-lg font-semibold text-sky-500">Rp {formatIDR(salePrice)}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
