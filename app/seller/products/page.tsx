import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { productCategories, productCategoryOptions, getCategoryInfo } from "@/lib/categories";
import { formatFlashSaleWindow, isFlashSaleActive } from "@/lib/flash-sale";

export const dynamic = 'force-dynamic';

export default async function SellerProducts({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Produk Saya</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun Anda sedang diblokir sehingga tidak dapat mengelola produk. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk bantuan lebih lanjut.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Produk Saya</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Fitur manajemen produk tersedia setelah toko Anda diaktifkan. Selesaikan langkah onboarding pada halaman
          <a className="ml-1 font-semibold underline" href="/seller/onboarding">
            onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const now = new Date();

  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: true,
        flashSales: {
          where: { endAt: { gte: now } },
          orderBy: { startAt: 'asc' },
        },
      },
    }),
    prisma.warehouse.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } })
  ]);

  const categoryLabel = (slug: string) => getCategoryInfo(slug)?.name ?? slug.replace(/-/g, ' ');

  const updatedFlag = typeof searchParams?.updated === 'string' || Array.isArray(searchParams?.updated);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Produk Saya</h1>
        <p className="text-sm text-gray-600">Kelola katalog produk dan status ketersediaannya.</p>
      </div>
      {updatedFlag ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Perubahan produk berhasil disimpan.
        </div>
      ) : null}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Tambah Produk</h2>
        <p className="mb-4 text-sm text-gray-500">
          Lengkapi detail produk untuk menambahkannya ke etalase toko Anda.
        </p>
        <form
          method="POST"
          action="/api/seller/products/create"
          encType="multipart/form-data"
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <select name="category" required className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
            <option value="">Pilih Kategori Produk</option>
            {productCategoryOptions.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.emoji} {category.parentName ? `${category.parentName} • ${category.name}` : category.name}
              </option>
            ))}
          </select>
          <select name="warehouseId" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
            <option value="">Pilih Gudang (opsional)</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.city ? `- ${w.city}` : ""}
              </option>
            ))}
          </select>
          <input
            name="title"
            required
            placeholder="Judul produk"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            name="price"
            required
            type="number"
            placeholder="Harga (integer)"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            name="originalPrice"
            type="number"
            placeholder="Harga sebelum diskon (opsional)"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            name="stock"
            type="number"
            placeholder="Stok"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium text-gray-700">Gambar Produk</span>
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <span className="block text-xs text-gray-500">
              Unggah hingga 5 gambar. Gambar pertama akan menjadi thumbnail utama.
            </span>
          </label>
          <textarea
            name="description"
            placeholder="Deskripsi"
            className="min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          ></textarea>
          <textarea
            name="variants"
            placeholder="Varian (contoh: Warna: Hitam, Putih)\nUkuran: 64GB, 128GB"
            className="min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          ></textarea>
          <p className="text-xs text-gray-500 md:col-span-2">
            Tambahkan setiap kelompok varian di baris baru dengan format <span className="font-medium">Nama: opsi1, opsi2</span>.
          </p>
          <button className="rounded-full bg-[#f53d2d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d73224] md:col-span-2">
            Simpan Produk
          </button>
        </form>
      </div>

      <div className="space-y-4 md:hidden">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Belum ada produk di toko Anda. Tambahkan produk pertama untuk mulai berjualan.
          </div>
        ) : (
          products.map((product) => {
            const formattedPrice = new Intl.NumberFormat("id-ID").format(product.price);
            const formattedOriginal = product.originalPrice
              ? new Intl.NumberFormat("id-ID").format(product.originalPrice)
              : null;
            const activeFlash = product.flashSales?.find((sale) => isFlashSaleActive(sale, now));
            const upcomingFlash = !activeFlash && product.flashSales?.length ? product.flashSales[0] : null;
            return (
              <article
                key={product.id}
                className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-xs text-gray-500">{product.warehouse ? `Gudang: ${product.warehouse.name}` : "Gudang: -"}</p>
                  </div>
                  <span className={`badge ${product.isActive ? "badge-paid" : "badge-pending"}`}>
                    {product.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <dl className="grid gap-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Kategori</dt>
                    <dd className="text-gray-900">{categoryLabel(product.category)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Harga</dt>
                    <dd className="text-gray-900">Rp {formattedPrice}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-500">Stok</dt>
                    <dd className="text-gray-900">{product.stock}</dd>
                  </div>
                  {formattedOriginal ? (
                    <div className="flex justify-between">
                      <dt className="font-medium text-gray-500">Harga Coret</dt>
                      <dd className="text-gray-400 line-through">Rp {formattedOriginal}</dd>
                    </div>
                  ) : null}
                </dl>
                {activeFlash ? (
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Flash sale aktif • {activeFlash.discountPercent}% — {formatFlashSaleWindow(activeFlash)}
                  </div>
                ) : upcomingFlash ? (
                  <div className="rounded-2xl bg-orange-50 px-3 py-2 text-xs text-orange-700">
                    Flash sale berikutnya • {upcomingFlash.discountPercent}% — {formatFlashSaleWindow(upcomingFlash)}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 px-3 py-2 text-xs text-gray-500">Belum ada flash sale</div>
                )}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="w-full rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    Edit Produk
                  </Link>
                  <form method="POST" action={`/api/seller/products/update/${product.id}`}>
                    <input type="hidden" name="toggle" value="1" />
                    <button className="w-full rounded-full bg-[#f53d2d] px-4 py-2 text-sm font-semibold text-white shadow-sm">
                      {product.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                  <form method="POST" action={`/api/seller/products/delete/${product.id}`}>
                    <button className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">
                      Hapus Produk
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Harga Coret</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Flash Sale</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">
                    {p.title}
                    <div className="text-xs text-gray-500">{p.warehouse ? `Gudang: ${p.warehouse.name}` : "Gudang: -"}</div>
                  </td>
                  <td>{categoryLabel(p.category)}</td>
                  <td>Rp {new Intl.NumberFormat("id-ID").format(p.price)}</td>
                  <td>{p.originalPrice ? `Rp ${new Intl.NumberFormat("id-ID").format(p.originalPrice)}` : "-"}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-paid" : "badge-pending"}`}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      if (!p.flashSales || p.flashSales.length === 0) {
                        return <span className="text-xs text-gray-400">Tidak ada</span>;
                      }

                      const active = p.flashSales.find((sale) => isFlashSaleActive(sale, now));
                      if (active) {
                        return (
                          <div className="space-y-1 text-xs">
                            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                              Aktif • {active.discountPercent}%
                            </span>
                            <div className="text-gray-500">{formatFlashSaleWindow(active)}</div>
                          </div>
                        );
                      }

                      const upcoming = p.flashSales[0];
                      return (
                        <div className="space-y-1 text-xs">
                          <span className="inline-flex items-center rounded bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                            Akan Datang • {upcoming.discountPercent}%
                          </span>
                          <div className="text-gray-500">{formatFlashSaleWindow(upcoming)}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="space-x-2">
                    <Link href={`/seller/products/${p.id}/edit`} className="btn-outline inline-block">
                      Edit
                    </Link>
                    <form method="POST" action={`/api/seller/products/update/${p.id}`} className="inline">
                      <input type="hidden" name="toggle" value="1" />
                      <button className="btn-outline">{p.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <form method="POST" action={`/api/seller/products/delete/${p.id}`} className="inline">
                      <button className="px-3 py-1 text-red-600">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
