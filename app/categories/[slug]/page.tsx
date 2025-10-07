import Link from "next/link";

import { fetchProductListing } from "@/lib/product-listing";
import { getCategoryInfo, productCategories, productCategoryOptions } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type CategorySort = "best" | "sold" | "rating" | "price-asc" | "price-desc";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { slug } = params;
  const category = getCategoryInfo(slug);
  const sortRaw = searchParams?.sort;
  const allowedSort: CategorySort[] = ["best", "sold", "rating", "price-asc", "price-desc"];
  const sort =
    typeof sortRaw === "string" && allowedSort.includes(sortRaw as CategorySort)
      ? (sortRaw as CategorySort)
      : "best";

  const products = await fetchProductListing({
    categorySlug: slug,
    sort,
  });

  const parentCategory = category?.parentSlug
    ? productCategories.find((item) => item.slug === category.parentSlug)
    : category?.parent;

  let relatedSubCategories = [] as typeof productCategoryOptions;
  if (category?.parentSlug) {
    relatedSubCategories = productCategoryOptions.filter(
      (option) => option.parentSlug === category.parentSlug,
    );
  } else if (category?.parent?.slug) {
    const parentSlug = category.parent.slug;
    relatedSubCategories = productCategoryOptions.filter(
      (option) => option.parentSlug === parentSlug,
    );
  } else if (category?.slug) {
    relatedSubCategories = productCategoryOptions.filter(
      (option) => option.parentSlug === category.slug,
    );
  }

  const buildSortLink = (value: CategorySort) => {
    const next = new URLSearchParams();
    if (value) next.set("sort", value);
    const query = next.toString();
    return query ? `?${query}` : "";
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 px-6 py-10 text-white shadow-xl">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
            {category?.parentName ? `${category.parentName} • ${category.name}` : category?.name ?? slug}
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            {category?.parentName ? `${category.parentName} - ${category.name}` : category?.name ?? slug}
          </h1>
          <p className="max-w-2xl text-sm text-indigo-100">
            {category?.description ?? "Temukan kurasi produk terbaik di kategori ini."}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/product" className="rounded-full bg-white/20 px-4 py-2 font-semibold text-white hover:bg-white/30">
              Lihat Semua Produk
            </Link>
            {parentCategory ? (
              <Link
                href={`/categories/${parentCategory.slug}`}
                className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
              >
                Kembali ke {parentCategory.name}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {relatedSubCategories && relatedSubCategories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Jelajahi Sub Kategori</h2>
          <div className="flex flex-wrap gap-2">
            {relatedSubCategories.map((sub) => (
              <Link
                key={sub.slug}
                href={`/categories/${sub.slug}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  sub.slug === slug ? "bg-orange-500 text-white" : "bg-white text-gray-700 shadow hover:bg-orange-50"
                }`}
              >
                {sub.parentName ? `${sub.parentName} • ${sub.name}` : sub.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pilihan Produk</h2>
            <p className="text-xs text-gray-500">Koleksi produk pilihan di kategori ini.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Urutkan:</span>
            <div className="flex flex-wrap gap-2">
              {(["best", "sold", "rating", "price-asc", "price-desc"] as CategorySort[]).map((value) => {
                const labels: Record<CategorySort, string> = {
                  best: "Direkomendasikan",
                  sold: "Terlaris",
                  rating: "Rating",
                  "price-asc": "Harga Naik",
                  "price-desc": "Harga Turun",
                };
                const isActive = sort === value;
                return (
                  <Link
                    key={value}
                    href={buildSortLink(value)}
                    className={`rounded-full px-3 py-1 transition ${
                      isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {labels[value]}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Belum ada produk yang tersedia dalam kategori ini.
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
