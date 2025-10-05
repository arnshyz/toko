import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { getCategoryInfo } from "@/lib/categories";
import { VariantSelector } from "@/components/VariantSelector";
import { VariantGroup } from "@/types/product";

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
    <span key={index} className={index < stars ? "text-orange-500" : "text-gray-300"}>
      ★
    </span>
  ));
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      seller: true,
      warehouse: true,
      _count: { select: { orderItems: true } },
    },
  });

  if (!product) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-600">
        Produk tidak ditemukan.
      </div>
    );
  }

  const [siblingProducts, recommendedProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        sellerId: product.sellerId,
        isActive: true,
        NOT: { id: product.id },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: {
        category: product.category,
        isActive: true,
        NOT: { id: product.id },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const category = getCategoryInfo(product.category);
  const originalPrice = typeof product.originalPrice === "number" ? product.originalPrice : null;
  const showOriginal = originalPrice !== null && originalPrice > product.price;
  const categoryLabel = category?.name ?? product.category.replace(/-/g, " ");
  const categoryEmoji = category?.emoji ?? "🏷️";
  const discountPercent = showOriginal
    ? Math.max(1, Math.round(((originalPrice - product.price) / originalPrice) * 100))
    : null;

  const variantGroups = ensureVariantGroups(product.variantOptions ?? undefined);
  const displayVariantGroups: VariantGroup[] = variantGroups.length > 0
    ? variantGroups
    : [{ name: "Varian", options: ["Standar"] }];

  const seller = product.seller;
  const badgeKey = seller.storeBadge ?? "BASIC";
  const badge = BADGE_STYLES[badgeKey] ?? BADGE_STYLES.BASIC;
  const isOnline = seller.storeIsOnline ?? false;
  const followers = seller.storeFollowers ?? 0;
  const following = seller.storeFollowing ?? 0;
  const ratingValue = seller.storeRating ?? 0;
  const ratingCount = seller.storeRatingCount ?? 0;
  const ratingLabel = ratingCount > 0
    ? `${ratingValue.toFixed(1)} dari ${ratingCount} penilaian`
    : "Belum ada penilaian";

  const soldCount = product._count?.orderItems ?? 0;
  const totalSellerProducts = siblingProducts.length + 1;
  const favoriteEstimate = Math.max(18, Math.round(product.price / 50000));
  const specifications: { label: string; value: string }[] = [
    { label: "Kategori", value: `${categoryEmoji} ${categoryLabel}` },
    { label: "Stok", value: `${product.stock} unit` },
    {
      label: "Gudang",
      value: product.warehouse
        ? `${product.warehouse.name}${product.warehouse.city ? `, ${product.warehouse.city}` : ""}`
        : "-",
    },
    { label: "Harga", value: `Rp ${formatIDR(product.price)}` },
    { label: "Harga Coret", value: showOriginal ? `Rp ${formatIDR(originalPrice)}` : "-" },
    {
      label: "Diposting",
      value: product.createdAt.toLocaleDateString("id-ID", {
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
        : "Toko akan memproses pesanan segera setelah kembali online.",
    },
  ];

  const reviewSamples = [
    {
      id: "1",
      author: "Andi Saputra",
      rating: 5,
      variant: variantGroups[0]?.options[0] ?? "Standar",
      createdAt: "2 minggu lalu",
      content:
        "Produk original, pengiriman cepat dan dikemas dengan rapi. Sangat puas berbelanja di toko ini.",
    },
    {
      id: "2",
      author: "Rina Oktavia",
      rating: 4,
      variant: variantGroups[0]?.options[1] ?? variantGroups[0]?.options[0] ?? "Standar",
      createdAt: "3 minggu lalu",
      content:
        "Sudah beberapa kali repeat order, kualitas konsisten dan penjual responsif ketika ditanya stok.",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <img
              src={product.imageUrl || "https://placehold.co/900x600?text=Produk"}
              alt={product.title}
              className="w-full rounded-xl object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex h-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white"
              >
                <img
                  src={product.imageUrl || "https://placehold.co/300x200?text=Preview"}
                  alt={`Preview ${index + 1}`}
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
            <nav className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Link href="/" className="hover:text-orange-500">
                Beranda
              </Link>
              <span>/</span>
              <span>Handphone &amp; Aksesoris</span>
              <span>/</span>
              <span className="capitalize">{categoryLabel}</span>
            </nav>

            <div className="space-y-2">
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

            <div className="rounded-xl bg-orange-50 p-5">
              <div className="flex flex-wrap items-end gap-4">
                <div className="text-3xl font-semibold text-orange-600">Rp {formatIDR(product.price)}</div>
                {showOriginal && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="line-through">Rp {formatIDR(originalPrice!)}</span>
                    {discountPercent && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                )}
              </div>
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

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Varian</h2>
                  <VariantSelector groups={displayVariantGroups} />
                  {variantGroups.length === 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Penjual belum menambahkan detail varian, produk tersedia dalam 1 pilihan standar.
                    </p>
                  )}
                </div>
              </div>

              <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-4" method="POST" action="/api/cart/add">
                <input type="hidden" name="productId" value={product.id} />
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Jumlah</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      name="qty"
                      defaultValue={1}
                      min={1}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-orange-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">Stok tersedia: {product.stock}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="flex-1 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
                    Masukkan Keranjang
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-orange-500 px-6 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                  >
                    Beli Sekarang
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:text-orange-600"
                  >
                    ❤ Favorit
                  </button>
                </div>
              </form>
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
                    {seller.name}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
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
                    <span>Penilaian: {ratingLabel}</span>
                    <span>Bergabung: {formatJoinedSince(seller.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/s/${seller.slug}`}
                  className="rounded-full border border-orange-500 px-5 py-2 text-center text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Kunjungi Toko
                </Link>
                <button className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
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
                    ? "border-orange-500 bg-orange-50 text-orange-600"
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
          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-orange-50 p-5 text-center">
            <div className="text-4xl font-semibold text-orange-500">{ratingValue.toFixed(1)}</div>
            <div className="mt-2 flex items-center justify-center gap-1 text-lg text-orange-500">
              {renderStars(ratingValue)}
            </div>
            <div className="mt-1 text-xs text-gray-600">{ratingCount} penilaian</div>
          </div>
          <div className="space-y-6">
            {ratingCount > 0 ? (
              <p className="text-sm text-gray-500">
                Penjual memperoleh rating yang baik dari para pembeli. Detail ulasan lengkap akan segera tersedia.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada penilaian untuk produk ini. Jadilah pembeli pertama yang memberikan ulasan!
              </p>
            )}

            <div className="space-y-4">
              {reviewSamples.map((review) => (
                <div key={review.id} className="space-y-3 rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>{review.author}</span>
                      <span className="flex gap-0.5 text-orange-500">{renderStars(review.rating)}</span>
                    </div>
                    <span>{review.createdAt}</span>
                  </div>
                  <div className="text-xs font-medium text-orange-600">Varian: {review.variant}</div>
                  <p className="text-sm text-gray-700">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Produk Lain dari Toko Ini</h2>
          <Link href={`/s/${seller.slug}`} className="text-sm font-semibold text-orange-600 hover:underline">
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
              const siblingCategory = getCategoryInfo(item.category);
              const siblingLabel = siblingCategory?.name ?? item.category.replace(/-/g, " ");
              const siblingEmoji = siblingCategory?.emoji ?? "🏷️";
              const siblingOriginal = typeof item.originalPrice === "number" ? item.originalPrice : null;
              const siblingShowOriginal = siblingOriginal !== null && siblingOriginal > item.price;

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={item.imageUrl || "https://placehold.co/600x400?text=Produk"}
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
                    <div className="text-lg font-semibold text-orange-500">Rp {formatIDR(item.price)}</div>
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
          <Link href="/" className="text-sm font-semibold text-orange-600 hover:underline">
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
              const recommendationCategory = getCategoryInfo(item.category);
              const recommendationLabel = recommendationCategory?.name ?? item.category.replace(/-/g, " ");
              const recommendationEmoji = recommendationCategory?.emoji ?? "🏷️";
              const recOriginal = typeof item.originalPrice === "number" ? item.originalPrice : null;
              const recShowOriginal = recOriginal !== null && recOriginal > item.price;

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={item.imageUrl || "https://placehold.co/600x400?text=Produk"}
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
                    <div className="text-lg font-semibold text-orange-500">Rp {formatIDR(item.price)}</div>
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
