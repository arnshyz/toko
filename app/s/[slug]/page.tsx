import { prisma } from "@/lib/prisma";
import { getCategoryInfo } from "@/lib/categories";
import { formatIDR } from "@/lib/utils";

const BADGE_STYLES: Record<string, { label: string; className: string }> = {
  BASIC: { label: "Basic", className: "bg-gray-100 text-gray-700" },
  STAR: { label: "Star", className: "bg-amber-100 text-amber-700" },
  STAR_PLUS: { label: "Star+", className: "bg-orange-100 text-orange-700" },
  MALL: { label: "MALL", className: "bg-red-100 text-red-600" },
  PREMIUM: { label: "Premium", className: "bg-indigo-100 text-indigo-600" },
};

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

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const badgeKey = seller.storeBadge ?? "BASIC";
  const badge = BADGE_STYLES[badgeKey] ?? BADGE_STYLES.BASIC;
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
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-600">
                  {seller.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
                {badge.label}
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

                <div className="flex items-center gap-3">
                  <button className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                    Ikuti
                  </button>
                  <button className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900">
                    Chat
                  </button>
                </div>
              </div>

              <dl className="grid gap-4 text-sm text-gray-600 sm:grid-cols-3 lg:grid-cols-5">
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
            <a className="text-orange-500">Halaman Utama</a>
            <a className="hover:text-orange-500">Produk</a>
            <a className="hover:text-orange-500">Sandal Pria</a>
            <a className="hover:text-orange-500">Sandal Jepit</a>
            <a className="hover:text-orange-500">Sandal Wanita</a>
            <a className="hover:text-orange-500">Sandal Unisex</a>
            <a className="hover:text-orange-500">Lainnya</a>
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
              const category = getCategoryInfo(p.category);
              const categoryLabel = category?.name ?? p.category.replace(/-/g, " ");
              const categoryEmoji = category?.emoji ?? "🏷️";
              const originalPrice = typeof p.originalPrice === "number" ? p.originalPrice : null;
              const showOriginal = originalPrice !== null && originalPrice > p.price;

              return (
                <a
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={p.imageUrl || "https://placehold.co/600x400?text=Produk"}
                    alt={p.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <span>{categoryEmoji}</span>
                      <span className="capitalize">{categoryLabel}</span>
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold text-gray-800">{p.title}</div>
                    {showOriginal && (
                      <div className="text-xs text-gray-400 line-through">Rp {formatIDR(originalPrice)}</div>
                    )}
                    <div className="text-lg font-semibold text-orange-500">Rp {formatIDR(p.price)}</div>
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
