import Link from "next/link";

import { getSiteSettings } from "@/lib/site-settings";
import { getSession } from "@/lib/session";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;

  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const siteSettings = await getSiteSettings();
  const logoInputDefault =
    siteSettings.logoUrl && siteSettings.logoUrl.startsWith("data:")
      ? ""
      : siteSettings.logoUrl ?? "";
  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pengaturan Identitas Website</h1>
          <p className="text-sm text-gray-500">
            Sesuaikan nama, deskripsi, dan logo untuk menjaga konsistensi brand di seluruh halaman.
          </p>
        </div>
        <Link href="/admin" className="link text-sm">
          &larr; Kembali ke dashboard admin
        </Link>
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

      <section className="space-y-5 rounded border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Detail Website</h2>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Informasi ini akan tampil di header, footer, dan meta halaman.
          </p>
        </div>
        <form
          method="POST"
          action="/api/admin/settings/update"
          encType="multipart/form-data"
          className="grid gap-5 md:grid-cols-2"
        >
          <input type="hidden" name="currentLogo" value={siteSettings.logoUrl ?? ""} />
          <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Nama Website
            <input
              type="text"
              name="siteName"
              required
              defaultValue={siteSettings.siteName}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
              placeholder="Contoh: Akay Nusantara"
            />
          </label>

          <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Deskripsi Website
            <textarea
              name="siteDescription"
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
              rows={4}
              placeholder="Deskripsi singkat tentang marketplace"
              defaultValue={siteSettings.siteDescription}
            />
          </label>

          <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700">Logo Website</h3>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50">
                {siteSettings.logoUrl ? (
                  <img
                    src={siteSettings.logoUrl}
                    alt={siteSettings.siteName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden className="text-2xl">🛍️</span>
                )}
              </div>
              <div className="flex-1 space-y-3 text-xs text-gray-600">
                <p className="font-medium uppercase tracking-wide text-gray-500">Pilihan Logo</p>
                <p>
                  Unggah berkas logo baru atau tempel tautan gambar. Gunakan format persegi (1:1) agar tampil sempurna di header.
                </p>
                <label className="block">
                  <span className="font-semibold uppercase tracking-wide text-gray-500">Tautan Logo</span>
                  <input
                    type="url"
                    name="logoUrl"
                    defaultValue={logoInputDefault}
                    placeholder="https://example.com/logo.png"
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold uppercase tracking-wide text-gray-500">Upload Logo (opsional)</span>
                  <input
                    type="file"
                    name="logoFile"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="mt-1 w-full text-sm"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <input type="checkbox" name="removeLogo" value="1" className="h-4 w-4" />
                  Hapus logo saat menyimpan
                </label>
                <p className="text-[11px] text-gray-500">
                  Jika tidak mencentang hapus logo, logo sebelumnya akan dipertahankan ketika tidak ada tautan atau berkas baru.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary text-xs">
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
