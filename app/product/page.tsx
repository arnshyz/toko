import Link from "next/link";

import { fetchProductListing } from "@/lib/product-listing";
import { getCategoryInfo, productCategoryOptions } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const ratingFilters = [
  { value: 4, label: "≥ 4 Bintang" },
  { value: 3, label: "≥ 3 Bintang" },
  { value: 2, label: "≥ 2 Bintang" },
];

const soldFilters = [
  { value: 100, label: "Sudah Terjual 100+" },
  { value: 50, label: "Sudah Terjual 50+" },
  { value: 10, label: "Sudah Terjual 10+" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "best", label: "Paling Direkomendasikan" },
  { value: "sold", label: "Paling Laris" },
  { value: "rating", label: "Rating Tertinggi" },
  { value: "price-asc", label: "Harga Termurah" },
  { value: "price-desc", label: "Harga Termahal" },
] as const;

type SortOptionValue = (typeof sortOptions)[number]["value"];

function parseNumberParam(value: string | string[] | undefined) {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const categorySlugRaw = searchParams?.category;
  const categorySlug = typeof categorySlugRaw === "string" ? categorySlugRaw : Array.isArray(categorySlugRaw) ? categorySlugRaw[0] : undefined;

  const minRating = parseNumberParam(searchParams?.rating);
  const minSold = parseNumberParam(searchParams?.sold);
  const sortRaw = searchParams?.sort;
  const sort =
    typeof sortRaw === "string" && sortOptions.some((option) => option.value === sortRaw)
      ? (sortRaw as SortOptionValue)
      : undefined;
  const searchQueryRaw = searchParams?.q;
  const searchQuery = typeof searchQueryRaw === "string" ? searchQueryRaw : Array.isArray(searchQueryRaw) ? searchQueryRaw[0] : undefined;

  const selectedCategory = categorySlug ? getCategoryInfo(categorySlug) : undefined;

  const products = await fetchProductListing({
    categorySlug,
    minRating,
    minSold,
    sort: sort ?? "newest",
    searchQuery,
  });

  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (minRating) params.set("rating", String(minRating));
  if (minSold) params.set("sold", String(minSold));
  if (searchQuery) params.set("q", searchQuery);
  if (sort) params.set("sort", sort);

  const buildLink = (overrides: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const queryString = next.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <div className="grid gap-6 md:grid-cols-[280px,1fr]">
      <aside className="space-y-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">Filter Produk</h1>
          <p className="text-xs text-gray-500">Sesuaikan filter untuk mendapatkan hasil terbaik.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Kategori</span>
            {categorySlug ? (
              <Link href={buildLink({ category: null })} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                Hapus
              </Link>
            ) : null}
          </div>
          <div className="grid gap-2">
            {productCategoryOptions.map((category) => {
              const isActive = category.slug === categorySlug;
              return (
                <Link
                  key={category.slug}
                  href={buildLink({ category: category.slug })}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                    isActive ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 hover:border-orange-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{category.emoji}</span>
                    <span>{category.parentName ? `${category.parentName} • ${category.name}` : category.name}</span>
                  </span>
                  {isActive ? <span aria-hidden>✓</span> : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Ulasan</span>
            {minRating ? (
              <Link href={buildLink({ rating: null })} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                Hapus
              </Link>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm">
            {ratingFilters.map((filter) => {
              const isActive = minRating === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={buildLink({ rating: String(filter.value) })}
                  className={`rounded-xl border px-3 py-2 transition ${
                    isActive ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 hover:border-orange-200"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Penjualan</span>
            {minSold ? (
              <Link href={buildLink({ sold: null })} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                Hapus
              </Link>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm">
            {soldFilters.map((filter) => {
              const isActive = minSold === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={buildLink({ sold: String(filter.value) })}
                  className={`rounded-xl border px-3 py-2 transition ${
                    isActive ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 hover:border-orange-200"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-500">
          <p>Kombinasikan filter untuk menemukan produk paling relevan sesuai kebutuhan Anda.</p>
          <p>
            Butuh bantuan? <Link href="/help" className="font-semibold text-indigo-600 hover:text-indigo-500">Hubungi tim kami</Link>
          </p>
        </div>
      </aside>

      <section className="space-y-5">
        <header className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedCategory ? selectedCategory.name : "Semua Produk"}</h2>
            <p className="text-xs text-gray-500">
              {selectedCategory?.parentName
                ? `${selectedCategory.parentName} • ${selectedCategory.name}`
                : selectedCategory?.description ?? "Temukan produk populer, terbaru, dan rekomendasi terbaik"}
            </p>
            {searchQuery ? <p className="text-xs text-indigo-600">Kata kunci: {searchQuery}</p> : null}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Urutkan:</span>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => {
                const isActive = (sort ?? "newest") === option.value;
                return (
                  <Link
                    key={option.value}
                    href={buildLink({ sort: option.value })}
                    className={`rounded-full px-3 py-1 transition ${
                      isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Belum ada produk yang sesuai filter saat ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                href={`/product/${product.id}`}
                title={product.title}
                imageUrl={product.imageUrl}
                salePrice={product.salePrice}
                basePrice={product.basePrice}
                originalPrice={product.originalPrice}
                ratingAverage={product.ratingAverage}
                ratingCount={product.ratingCount}
                soldCount={product.soldCount}
                storeBadge={product.storeBadge}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
