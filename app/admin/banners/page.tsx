import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;

  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const banners = await prisma.promoBanner.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin: Kelola Banner Promo</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="link" href="/admin/users">
            Manajemen Pengguna
          </Link>
          <Link className="link" href="/admin/products">
            Kelola Produk
          </Link>
          <Link className="link" href="/admin/vouchers">
            Kelola Voucher
          </Link>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold">Tambah Banner Baru</h2>
        <p className="mt-1 text-sm text-gray-500">
          Lengkapi data di bawah untuk menambahkan slide promo baru pada beranda publik.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" method="POST" action="/api/admin/banners/create">
          <label className="flex flex-col text-sm">
            <span className="font-medium">Judul</span>
            <input className="rounded border px-3 py-2" name="title" placeholder="Contoh: Promo Spesial" required />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Highlight</span>
            <input className="rounded border px-3 py-2" name="highlight" placeholder="Contoh: Diskon 50%" required />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            <span className="font-medium">Deskripsi</span>
            <textarea
              className="rounded border px-3 py-2"
              name="description"
              placeholder="Detail singkat promonya"
              rows={3}
              required
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">URL Gambar</span>
            <input
              className="rounded border px-3 py-2"
              name="imageUrl"
              placeholder="https://..."
              type="url"
              required
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Label Tombol</span>
            <input className="rounded border px-3 py-2" name="ctaLabel" placeholder="Contoh: Belanja" required />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Tujuan Tombol</span>
            <input
              className="rounded border px-3 py-2"
              name="ctaHref"
              placeholder="/product atau https://..."
              required
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Urutan</span>
            <input className="rounded border px-3 py-2" name="sortOrder" type="number" defaultValue={banners.length} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input className="h-4 w-4" type="checkbox" name="isActive" defaultChecked />
            <span>Aktifkan banner ini</span>
          </label>
          <div className="md:col-span-2">
            <button className="btn-outline" type="submit">
              Simpan Banner
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Banner</h2>
        {banners.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Belum ada banner yang tersimpan.
          </div>
        ) : null}
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="md:w-1/3">
                  <div className="aspect-[3/2] overflow-hidden rounded-lg border bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    method="POST"
                    action={`/api/admin/banners/${banner.id}/update`}
                  >
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">Judul</span>
                      <input className="rounded border px-3 py-2" name="title" defaultValue={banner.title} required />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">Highlight</span>
                      <input className="rounded border px-3 py-2" name="highlight" defaultValue={banner.highlight} required />
                    </label>
                    <label className="flex flex-col text-sm md:col-span-2">
                      <span className="font-medium">Deskripsi</span>
                      <textarea
                        className="rounded border px-3 py-2"
                        name="description"
                        rows={3}
                        defaultValue={banner.description}
                        required
                      />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">URL Gambar</span>
                      <input className="rounded border px-3 py-2" name="imageUrl" defaultValue={banner.imageUrl} required />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">Label Tombol</span>
                      <input className="rounded border px-3 py-2" name="ctaLabel" defaultValue={banner.ctaLabel} required />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">Tujuan Tombol</span>
                      <input className="rounded border px-3 py-2" name="ctaHref" defaultValue={banner.ctaHref} required />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="font-medium">Urutan</span>
                      <input
                        className="rounded border px-3 py-2"
                        name="sortOrder"
                        type="number"
                        defaultValue={banner.sortOrder}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input className="h-4 w-4" type="checkbox" name="isActive" defaultChecked={banner.isActive} />
                      <span>Tampilkan di beranda</span>
                    </label>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button className="btn-outline" type="submit">
                        Perbarui Banner
                      </button>
                      <a className="text-xs text-gray-500" href={`#banner-${banner.id}`}>
                        ID: {banner.id}
                      </a>
                    </div>
                  </form>
                  <form
                    className="inline-block"
                    method="POST"
                    action={`/api/admin/banners/${banner.id}/delete`}
                  >
                    <button
                      className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      type="submit"
                    >
                      Hapus Banner
                    </button>
                  </form>
                  <div id={`banner-${banner.id}`} className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                    <div>Urutan: {banner.sortOrder}</div>
                    <div>Diupdate: {banner.updatedAt.toLocaleString("id-ID")}</div>
                    <div>Status: {banner.isActive ? "Aktif" : "Non-aktif"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
