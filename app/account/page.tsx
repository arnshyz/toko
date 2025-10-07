import { redirect } from "next/navigation";

import { ProvinceSelect } from "@/components/ProvinceSelect";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

const GENDER_OPTIONS: { value: "" | Gender; label: string }[] = [
  { value: "", label: "Pilih jenis kelamin" },
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
  { value: "OTHER", label: "Lainnya" },
];

type AccountPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getSession();
  const viewer = session.user;

  if (!viewer) {
    redirect("/seller/login");
  }

  const account = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: {
      name: true,
      email: true,
      username: true,
      avatarUrl: true,
      phoneNumber: true,
      gender: true,
      addresses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          province: true,
          city: true,
          district: true,
          postalCode: true,
          addressLine: true,
          additionalInfo: true,
          createdAt: true,
        },
      },
    },
  });

  if (!account) {
    redirect("/seller/login");
  }

  const profileError = typeof searchParams?.profileError === "string" ? searchParams.profileError : null;
  const profileUpdated = searchParams?.profileUpdated === "1";
  const addressError = typeof searchParams?.addressError === "string" ? searchParams.addressError : null;
  const addressAdded = searchParams?.addressAdded === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Akun Saya</h1>
        <p className="text-sm text-gray-600">Kelola informasi profil dan alamat pengiriman Anda.</p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
            <p className="text-sm text-gray-600">Perbarui informasi dasar akun pembeli Anda.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
              {account.avatarUrl?.trim() ? (
                <img
                  src={account.avatarUrl}
                  alt={account.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-500">
                  {account.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{account.name}</p>
              <p>{account.email}</p>
            </div>
          </div>
        </div>

        {profileError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </div>
        ) : null}

        {profileUpdated ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Profil berhasil diperbarui.
          </div>
        ) : null}

        <form method="POST" action="/api/account/profile" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/account" />

          <div className="space-y-1">
            <label htmlFor="avatarUrl" className="text-sm font-medium text-gray-700">
              Foto profil (URL)
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              placeholder="https://contoh.com/foto.jpg"
              defaultValue={account.avatarUrl ?? ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
            <p className="text-xs text-gray-500">Gunakan tautan gambar langsung berformat http atau https.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="nama-pengguna"
              minLength={3}
              defaultValue={account.username ?? ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
            <p className="text-xs text-gray-500">Username digunakan untuk identitas publik di masa mendatang.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              defaultValue={account.name}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={account.email}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
              Nomor telepon
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              defaultValue={account.phoneNumber ?? ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
            <p className="text-xs text-gray-500">Masukkan nomor aktif untuk memudahkan konfirmasi pesanan.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="gender" className="text-sm font-medium text-gray-700">
              Jenis kelamin
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={(account.gender as Gender | null) ?? ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="submit" className="btn-primary">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alamat Pengiriman</h2>
            <p className="text-sm text-gray-600">Tambahkan alamat baru untuk mempercepat proses checkout.</p>
          </div>
        </div>

        {addressError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {addressError}
          </div>
        ) : null}

        {addressAdded ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Alamat baru berhasil ditambahkan.
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {account.addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
              Belum ada alamat tersimpan. Tambahkan alamat pertama Anda melalui formulir di bawah.
            </div>
          ) : (
            account.addresses.map((address) => (
              <div key={address.id} className="rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{address.fullName}</p>
                    <p className="text-xs text-gray-500">{address.phoneNumber}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(address.createdAt))}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>
                    {address.addressLine}
                    {address.additionalInfo ? `, ${address.additionalInfo}` : ""}
                  </p>
                  <p>
                    {address.district}, {address.city}, {address.province} {address.postalCode}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form method="POST" action="/api/account/addresses" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/account" />

          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phoneNumberAddress" className="text-sm font-medium text-gray-700">
              Nomor Telepon
            </label>
            <input
              id="phoneNumberAddress"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="province" className="text-sm font-medium text-gray-700">
              Provinsi
            </label>
            <ProvinceSelect
              id="province"
              name="province"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium text-gray-700">
              Kota / Kabupaten
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="district" className="text-sm font-medium text-gray-700">
              Kecamatan
            </label>
            <input
              id="district"
              name="district"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
              Kode Pos
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              required
              pattern="\d{4,10}"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="addressLine" className="text-sm font-medium text-gray-700">
              Alamat Lengkap
            </label>
            <textarea
              id="addressLine"
              name="addressLine"
              required
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="additionalInfo" className="text-sm font-medium text-gray-700">
              Detail Lainnya (opsional)
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              rows={2}
              placeholder="Contoh: Patokan rumah warna hijau, blok B nomor 3"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="submit" className="btn-primary">
              Simpan Alamat
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
