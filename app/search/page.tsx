import { prisma } from "@/lib/prisma";
import { getPrimaryProductImageSrc } from "@/lib/productImages";
import { calculateFlashSalePrice, getActiveFlashSale } from "@/lib/flash-sale";
import { ProductCard } from "@/components/ProductCard";
import { getProductRatingSummary } from "@/lib/product-ratings";

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
          seller: { select: { name: true, slug: true, storeBadge: true } },
          images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
          flashSales: {
            where: { endAt: { gte: now } },
            orderBy: { startAt: "asc" },
          },
          _count: { select: { orderItems: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 48,
      })
    : [];
  const ratingSummary = await getProductRatingSummary(products.map((product) => product.id));

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
                : product.price;
              const rating = ratingSummary.get(product.id);
              const soldCount = product._count?.orderItems ?? 0;

              return (
                <ProductCard
                  key={product.id}
                  href={`/product/${product.id}`}
                  title={product.title}
                  imageUrl={imageUrl}
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
