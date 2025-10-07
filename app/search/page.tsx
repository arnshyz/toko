import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function ensureQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = ensureQuery(searchParams?.q);
  const hasQuery = query.length > 0;
  const now = new Date();

  const products = hasQuery
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          seller: { select: { name: true, slug: true } },
          images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
          flashSales: {
            where: { endAt: { gte: now } },
            orderBy: { startAt: "asc" },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 48,
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-to-r from-[#f53d2d] via-[#ff6f3c] to-[#ff9364] p-[1px] shadow-lg">
        <div className="rounded-3xl bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">Hasil Pencarian</h1>
              <p className="text-sm text-gray-500">
                {hasQuery
                  ? `Menampilkan produk terkait "${query}"`
                  : "Cari produk terbaik untuk kebutuhan digital Anda."}
              </p>
            </div>
            <form
              className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center"
              action="/search"
              method="GET"
            >
              <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 shadow-inner">
                <span aria-hidden className="text-lg text-[#f53d2d]">🔍</span>
                <input
                  name="q"
                  defaultValue={query}
                  type="search"
                  placeholder="Cari produk, jasa, atau voucher"
                  className="w-full bg-transparent outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#f53d2d] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#d73224]"
              >
                Cari
              </button>
            </form>
          </div>
        </div>
      </div>

      {hasQuery ? (
        products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {products.map((product) => {
              const imageUrl = getPrimaryProductImageSrc(product);
              const activeFlashSale = getActiveFlashSale(product.flashSales ?? [], now);
              const salePrice = activeFlashSale
                ? calculateFlashSalePrice(product.price, activeFlashSale)
                : null;
              const displayPrice = salePrice ?? product.price;
              let comparePrice: number | null = null;
              if (salePrice) {
                comparePrice = product.price;
              } else if (product.originalPrice && product.originalPrice > product.price) {
                comparePrice = product.originalPrice;
              }

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">🛍️</div>
                    )}
                    {activeFlashSale ? (
                      <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                        Flash Sale {activeFlashSale.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                    <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.title}</h2>
                    <p className="text-xs text-gray-500">{product.seller.name}</p>
                    <div className="mt-auto space-y-1">
                      <p className="text-lg font-bold text-[#f53d2d]">Rp {formatIDR(displayPrice)}</p>
                      {comparePrice ? (
                        <p className="text-xs text-gray-400 line-through">Rp {formatIDR(comparePrice)}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">Hasil tidak ditemukan</p>
            <p className="mt-2 text-sm text-gray-500">Coba gunakan kata kunci lain atau periksa ejaan pencarian Anda.</p>
          </div>
        )
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">Mulai pencarian Anda</p>
          <p className="mt-2 text-sm text-gray-500">Tulis kata kunci produk atau layanan yang ingin Anda temukan pada kolom di atas.</p>
        </div>
      )}
    </div>
  );
}
