import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  calculateFlashSalePrice,
  formatFlashSaleWindow,
  isFlashSaleActive,
  toFlashSaleInputValue,
} from "@/lib/flash-sale";
import { formatIDR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerFlashSalesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return <div>Harap login sebagai seller.</div>;
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Flash Sale</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun Anda sedang diblokir sehingga tidak dapat mengatur flash sale. Hubungi{' '}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>{' '}
          untuk bantuan lebih lanjut.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Flash Sale</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Fitur flash sale dapat digunakan setelah toko Anda aktif. Selesaikan langkah onboarding pada{' '}
          <a className="font-semibold underline" href="/seller/onboarding">
            halaman onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const now = new Date();
  const [products, flashSales] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: user.id, isActive: true },
      orderBy: { title: "asc" },
    }),
    prisma.flashSale.findMany({
      where: { sellerId: user.id },
      orderBy: { startAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            originalPrice: true,
          },
        },
      },
    }),
  ]);

  const minStartValue = toFlashSaleInputValue(new Date(Date.now() + 15 * 60 * 1000));
  const minEndValue = toFlashSaleInputValue(new Date(Date.now() + 60 * 60 * 1000));

  const successMessage = typeof searchParams?.success === "string" ? searchParams?.success : null;
  const errorMessage = typeof searchParams?.error === "string" ? searchParams?.error : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Flash Sale</h1>
        <p className="text-sm text-gray-600">Atur jadwal promo kilat untuk meningkatkan penjualan produk unggulan Anda.</p>
      </div>

      {(successMessage || errorMessage) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            successMessage
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {successMessage ?? errorMessage}
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Buat Flash Sale</h2>
        <p className="mb-4 text-sm text-gray-500">Pilih produk dan tentukan periode promo singkatnya.</p>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
            Anda belum memiliki produk aktif. Tambahkan produk terlebih dahulu sebelum membuat flash sale.
          </div>
        ) : (
          <form
            method="POST"
            action="/api/seller/flash-sales/create"
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <label className="text-sm font-medium text-gray-700">
              <span className="mb-1 block">Produk</span>
              <select name="productId" required className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="">Pilih produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700">
              <span className="mb-1 block">Diskon (%)</span>
              <input
                type="number"
                name="discountPercent"
                min={5}
                max={90}
                required
                placeholder="Contoh: 25"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              <span className="mb-1 block">Mulai</span>
              <input
                type="datetime-local"
                name="startAt"
                required
                min={minStartValue}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              <span className="mb-1 block">Berakhir</span>
              <input
                type="datetime-local"
                name="endAt"
                required
                min={minEndValue}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="flex items-center justify-end md:col-span-2">
              <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-strong">
                Simpan Flash Sale
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-4 md:hidden">
        {flashSales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Belum ada flash sale yang diatur.
          </div>
        ) : (
          flashSales.map((sale) => {
            const product = sale.product;
            const isActiveSale = isFlashSaleActive(sale, now);
            const hasEnded = sale.endAt < now;
            const statusLabel = isActiveSale ? "Sedang berlangsung" : hasEnded ? "Selesai" : "Akan datang";
            const statusClass = isActiveSale
              ? "bg-emerald-100 text-emerald-700"
              : hasEnded
              ? "bg-gray-100 text-gray-600"
              : "bg-orange-100 text-orange-700";

            const basePrice = product.price;
            const salePrice = calculateFlashSalePrice(basePrice, sale);
            const referenceOriginal =
              typeof product.originalPrice === "number" && product.originalPrice > basePrice
                ? product.originalPrice
                : basePrice;

            return (
              <article key={sale.id} className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-xs text-gray-500">Periode: {formatFlashSaleWindow(sale)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="rounded-2xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <p>Harga normal: Rp {formatIDR(basePrice)}</p>
                  {referenceOriginal > basePrice ? (
                    <p className="text-gray-400 line-through">Harga sebelum diskon: Rp {formatIDR(referenceOriginal)}</p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-primary">
                    Diskon {sale.discountPercent}% • Harga flash Rp {formatIDR(salePrice)}
                  </p>
                </div>
                <form method="POST" action={`/api/seller/flash-sales/delete/${sale.id}`}>
                  <button className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">
                    Hapus Flash Sale
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold text-gray-700">Daftar Flash Sale</div>
          {flashSales.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Belum ada flash sale yang diatur.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Diskon</th>
                    <th className="px-4 py-3">Harga Saat Flash Sale</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {flashSales.map((sale) => {
                    const product = sale.product;
                    const isActiveSale = isFlashSaleActive(sale, now);
                    const hasEnded = sale.endAt < now;
                    const statusLabel = isActiveSale
                      ? "Sedang berlangsung"
                      : hasEnded
                      ? "Selesai"
                      : "Akan datang";
                    const statusClass = isActiveSale
                      ? "bg-emerald-100 text-emerald-700"
                      : hasEnded
                      ? "bg-gray-100 text-gray-600"
                      : "bg-orange-100 text-orange-700";

                    const basePrice = product.price;
                    const salePrice = calculateFlashSalePrice(basePrice, sale);
                    const referenceOriginal =
                      typeof product.originalPrice === "number" && product.originalPrice > basePrice
                        ? product.originalPrice
                        : basePrice;

                    return (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-xs text-gray-500">Harga normal: Rp {formatIDR(basePrice)}</div>
                          {referenceOriginal > basePrice && (
                            <div className="text-xs text-gray-400 line-through">
                              Harga sebelum diskon: Rp {formatIDR(referenceOriginal)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600">
                          {formatFlashSaleWindow(sale)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="font-semibold text-orange-600">{sale.discountPercent}%</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-gray-900">Rp {formatIDR(salePrice)}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <form method="POST" action={`/api/seller/flash-sales/delete/${sale.id}`}>
                            <button className="text-sm text-red-600 hover:text-red-700">Hapus</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
