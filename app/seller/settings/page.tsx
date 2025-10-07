import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SellerSettings({ searchParams }: SettingsPageProps) {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    redirect("/seller/login");
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      slug: true,
      isBanned: true,
      sellerOnboardingStatus: true,
      storeAddressLine: true,
      storeProvince: true,
      storeCity: true,
      storeDistrict: true,
      storePostalCode: true,
      storeOriginCityId: true,
    },
  });

  if (!account) {
    redirect("/seller/login");
  }

  if (account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Pengaturan Toko</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun seller Anda telah diblokir oleh tim admin karena pelanggaran. Hubungi{" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>{" "}
          untuk proses banding atau informasi lebih lanjut.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Pengaturan Toko</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Pengaturan toko baru tersedia setelah proses onboarding selesai. Silakan ikuti panduan pada halaman
          <a className="ml-1 font-semibold underline" href="/seller/onboarding">
            onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const errorMessage = typeof searchParams?.error === "string" ? searchParams?.error : null;
  const successMessage = searchParams?.updated === "1";
  const addressError = typeof searchParams?.addressError === "string" ? searchParams.addressError : null;
  const addressSuccess = searchParams?.addressUpdated === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengaturan Toko</h1>
          <p className="text-sm text-gray-600">Atur nama dan tampilan toko agar mudah ditemukan pembeli.</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 md:w-auto"
        >
          Kembali ke dashboard
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Profil toko berhasil diperbarui.
        </div>
      ) : null}

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <form method="POST" action="/api/seller/store/profile" className="space-y-4">
          <input type="hidden" name="redirectTo" value="/seller/settings" />
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama toko
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              defaultValue={account.name}
              placeholder="Contoh: Akay Nusantara"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-gray-500">Nama toko akan ditampilkan kepada pembeli di halaman etalase Anda.</p>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Alamat etalase</span>
            <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center">
              <span className="rounded-lg bg-gray-100 px-3 py-2 text-center text-gray-700 md:text-left">https://akay.id/s/</span>
              <span className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center font-mono text-gray-800 md:text-left">{account.slug}</span>
            </div>
            <p className="text-xs text-gray-500">
              Alamat toko akan mengikuti nama toko secara otomatis dan dapat berubah ketika nama diperbarui.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-strong" type="submit">
              Simpan perubahan
            </button>
            <span className="text-xs text-gray-500 md:ml-3">Perubahan dapat memerlukan waktu beberapa menit untuk muncul di hasil pencarian.</span>
          </div>
        </form>
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div>
          <h2 className="text-lg font-semibold">Alamat Toko</h2>
          <p className="text-sm text-gray-600">
            Alamat ini digunakan sebagai kota asal pengiriman default ketika produk belum terhubung ke gudang tertentu.
          </p>
        </div>

        {addressError ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addressError}</div>
        ) : null}

        {addressSuccess ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Alamat toko berhasil diperbarui.
          </div>
        ) : null}

        <form method="POST" action="/api/seller/store/address" className="space-y-4">
          <input type="hidden" name="redirectTo" value="/seller/settings" />
          <div className="space-y-1">
            <label htmlFor="storeAddressLine" className="text-sm font-medium text-gray-700">
              Alamat lengkap
            </label>
            <textarea
              id="storeAddressLine"
              name="addressLine"
              defaultValue={account.storeAddressLine ?? ""}
              placeholder="Contoh: Jl. Melati No. 10, Blok B"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="storeProvince" className="text-sm font-medium text-gray-700">
                Provinsi<span className="text-red-500">*</span>
              </label>
              <input
                id="storeProvince"
                name="province"
                type="text"
                required
                defaultValue={account.storeProvince ?? ""}
                placeholder="Contoh: Jawa Barat"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="storeCity" className="text-sm font-medium text-gray-700">
                Kota / Kabupaten<span className="text-red-500">*</span>
              </label>
              <input
                id="storeCity"
                name="city"
                type="text"
                required
                defaultValue={account.storeCity ?? ""}
                placeholder="Contoh: Bandung"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="storeDistrict" className="text-sm font-medium text-gray-700">
                Kecamatan
              </label>
              <input
                id="storeDistrict"
                name="district"
                type="text"
                defaultValue={account.storeDistrict ?? ""}
                placeholder="Contoh: Sukajadi"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="storePostalCode" className="text-sm font-medium text-gray-700">
                Kode pos
              </label>
              <input
                id="storePostalCode"
                name="postalCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={account.storePostalCode ?? ""}
                placeholder="Contoh: 40162"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="storeOriginCityId" className="text-sm font-medium text-gray-700">
              Kode Kota RajaOngkir
            </label>
            <input
              id="storeOriginCityId"
              name="originCityId"
              type="text"
              defaultValue={account.storeOriginCityId ?? ""}
              placeholder="Opsional, isi jika Anda tahu kode kota RajaOngkir"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-gray-500">
              Mengisi kode kota RajaOngkir membantu mempercepat pencocokan kota asal secara otomatis.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-strong" type="submit">
              Simpan alamat
            </button>
            <span className="text-xs text-gray-500 md:ml-3">Pastikan kota sesuai dengan data RajaOngkir agar ongkir otomatis berhasil.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
