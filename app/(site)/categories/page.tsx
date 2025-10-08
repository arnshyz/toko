import Link from "next/link";

import { getProductCategories, getProductCategoryOptions } from "@/lib/categories";

export const metadata = {
  title: "Kategori Produk | Akay Nusantara",
  description: "Telusuri kategori produk untuk menemukan barang sesuai kebutuhan Anda.",
};

const quickFilters: { label: string; slug?: string; href?: string }[] = [
  { label: "Produk Digital", slug: "produk-digital" },
  { label: "Terbaru", href: "/product?sort=newest" },
  { label: "Terlaris", href: "/product?sort=best" },
  { label: "Banyak Terjual", href: "/product?sort=sold" },
];

export default async function CategoriesPage() {
  const [productCategories, productCategoryOptions] = await Promise.all([
    getProductCategories(),
    getProductCategoryOptions(),
  ]);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-400 px-6 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl font-bold md:text-4xl">Jelajahi Kategori Produk</h1>
            <p className="text-sm md:text-base text-sky-50/90">
              Pilih kategori atau sub-kategori untuk menemukan produk yang Anda inginkan. Filter pintar membantu Anda fokus pada produk yang relevan.
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              {quickFilters.map((filter) => (
                <Link
                  key={filter.slug ?? filter.href}
                  href={filter.href ?? `/categories/${filter.slug}`}
                  className="rounded-full bg-white/15 px-4 py-2 backdrop-blur transition hover:bg-white/30"
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:block text-6xl" aria-hidden>
            🧭
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-gray-900">Semua Kategori</h2>
          <p className="text-sm text-gray-600">
            Setiap kategori memiliki sub-kategori khusus untuk mempercepat pencarian produk.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {productCategories.map((category) => (
            <article
              key={category.slug}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <header className="flex items-start justify-between">
                <div>
                  <p className="text-3xl">{category.emoji}</p>
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <Link
                  href={`/categories/${category.slug}`}
                  className="rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                >
                  Lihat Produk
                </Link>
              </header>
              {category.subCategories?.length ? (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sub Kategori</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.subCategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/categories/${sub.slug}`}
                        className="rounded-full border border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-sky-200 hover:text-sky-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-inner">
        <div className="grid gap-4 md:grid-cols-[1.25fr,1fr] md:items-center">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-indigo-900">Butuh Bantuan Menemukan Produk?</h2>
            <p className="text-sm text-indigo-700">
              Gunakan halaman bantuan atau hubungi tim kami. Kami siap memberikan rekomendasi kategori dan produk yang sesuai dengan kebutuhan bisnis Anda.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/help"
                className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500"
              >
                Kunjungi Bantuan
              </Link>
              <Link
                href="/support"
                className="rounded-full border border-indigo-300 px-4 py-2 text-indigo-700 hover:border-indigo-400 hover:text-indigo-800"
              >
                Hubungi Tim
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white/70 p-4 text-sm text-indigo-700 shadow-sm">
            <p className="font-semibold">Kategori populer minggu ini:</p>
            <ul className="mt-2 space-y-2">
              {productCategoryOptions.slice(0, 6).map((category) => (
                <li key={category.slug} className="flex items-center justify-between">
                  <span>
                    {category.emoji} {category.parentName ? `${category.parentName} • ${category.name}` : category.name}
                  </span>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Telusuri
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
