import Link from "next/link";
import { redirect } from "next/navigation";

import { AddressRegionFields } from "@/components/AddressRegionFields";
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

  const [pendingOrders, cancelledOrders, packedItems, shippedItems, deliveredItems] = await Promise.all([
    prisma.order.count({ where: { buyerId: viewer.id, status: "PENDING" } }),
    prisma.order.count({ where: { buyerId: viewer.id, status: "CANCELLED" } }),
    prisma.orderItem.count({ where: { order: { buyerId: viewer.id }, status: "PACKED" } }),
    prisma.orderItem.count({ where: { order: { buyerId: viewer.id }, status: "SHIPPED" } }),
    prisma.orderItem.count({ where: { order: { buyerId: viewer.id }, status: "DELIVERED" } }),
  ]);

  const orderSummary = [
    { label: "Belum Bayar", value: pendingOrders, icon: "💳", href: "/orders?status=PENDING" },
    { label: "Dikemas", value: packedItems, icon: "📦", href: "/orders?status=PACKED" },
    { label: "Dikirim", value: shippedItems, icon: "🚚", href: "/orders?status=SHIPPED" },
    { label: "Selesai", value: deliveredItems, icon: "✅", href: "/orders?status=DELIVERED" },
  ];

  const profileError = typeof searchParams?.profileError === "string" ? searchParams.profileError : null;
  const profileUpdated = searchParams?.profileUpdated === "1";
  const addressError = typeof searchParams?.addressError === "string" ? searchParams.addressError : null;
  const addressAdded = searchParams?.addressAdded === "1";
  const addressUpdated = searchParams?.addressUpdated === "1";
  const editAddressId = typeof searchParams?.editAddress === "string" ? searchParams.editAddress : null;
  const editingAddress = editAddressId
    ? account.addresses.find((address) => address.id === editAddressId)
    : null;
  const isEditingInvalid = Boolean(editAddressId && !editingAddress);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="space-y-4 md:hidden">
        <div className="relative rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-300 px-6 py-6 text-white shadow-lg">
          <form method="POST" action="/api/auth/logout" className="absolute right-4 top-4">
            <button
              type="submit"
              className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/30"
            >
              Keluar
            </button>
          </form>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Akun Saya</p>
              <p className="text-lg font-semibold">{account.name}</p>
              <p className="text-xs text-white/80">{account.email}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs font-medium text-white/90">
            <div>
              <p className="text-white/70">Alamat Utama</p>
              <p className="max-w-[220px] text-white">
                {account.addresses[0]
                  ? `${account.addresses[0].addressLine}, ${account.addresses[0].city}`
                  : "Belum ada alamat tersimpan"}
              </p>
            </div>
            <Link href="/orders" className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white">
              Pesanan Saya
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pesanan Saya</h2>
              <p className="text-xs text-gray-500">Lacak status terbaru transaksi Anda.</p>
            </div>
            <Link href="/orders" className="text-xs font-semibold text-sky-600">
              Lihat riwayat
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 text-center text-[11px] font-medium text-gray-700">
            {orderSummary.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3 shadow-sm"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs text-gray-900">{item.label}</span>
                <span className="text-[11px] font-semibold text-sky-600">{item.value}</span>
              </Link>
            ))}
            <Link
              href="/orders?status=CANCELLED"
              className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3 shadow-sm"
            >
              <span className="text-xl">🚫</span>
              <span className="text-xs text-gray-900">Dibatalkan</span>
              <span className="text-[11px] font-semibold text-sky-600">{cancelledOrders}</span>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-700">
          <Link
            href="/seller/dashboard"
            className="col-span-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 px-5 py-4 text-white shadow-md"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-xl">🛍️</span>
              <div>
                <p className="text-sm font-semibold">Dashboard Seller</p>
                <p className="text-xs font-normal text-white/80">Kelola toko dan pesanan penjualan Anda</p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              Masuk
            </span>
          </Link>
          <Link href="/voucher" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-sm text-gray-900">Voucher Saya</p>
              <p className="text-xs font-normal text-gray-500">Cek promo dan cashback terbaru</p>
            </div>
          </Link>
          <Link href="/support" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-lg">🛟</span>
            <div>
              <p className="text-sm text-gray-900">Bantuan</p>
              <p className="text-xs font-normal text-gray-500">Pusat bantuan dan layanan pelanggan</p>
            </div>
          </Link>
        </div>
      </div>
      <header className="hidden space-y-1 md:block">
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
            <div className="relative aspect-square w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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

        {addressUpdated ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Alamat berhasil diperbarui.
          </div>
        ) : null}

        {isEditingInvalid ? (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Alamat yang ingin diedit tidak ditemukan.
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {account.addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
              Belum ada alamat tersimpan. Tambahkan alamat pertama Anda melalui formulir di bawah.
            </div>
          ) : (
            account.addresses.map((address) => (
              <div
                key={address.id}
                className={`rounded-xl border p-5 shadow-sm transition ${
                  address.id === editingAddress?.id
                    ? "border-sky-400 ring-2 ring-sky-500/20"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{address.fullName}</p>
                    <p className="text-xs text-gray-500">{address.phoneNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                      }).format(new Date(address.createdAt))}
                    </span>
                    <a
                      href={`/account?editAddress=${encodeURIComponent(address.id)}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-sky-400 hover:text-sky-600"
                    >
                      Edit
                    </a>
                  </div>
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

        {editingAddress ? (
          <form
            method="POST"
            action={`/api/account/addresses/${editingAddress.id}`}
            className="mb-10 grid gap-4 rounded-2xl border border-gray-200 p-6 md:grid-cols-2"
          >
            <input
              type="hidden"
              name="redirectTo"
              value={`/account?editAddress=${encodeURIComponent(editingAddress.id)}`}
            />
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-900">Edit alamat</h3>

            <div className="space-y-1">
              <label htmlFor="editFullName" className="text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                id="editFullName"
                name="fullName"
                type="text"
                required
                defaultValue={editingAddress.fullName}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="editPhoneNumber" className="text-sm font-medium text-gray-700">
                Nomor Telepon
              </label>
              <input
                id="editPhoneNumber"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                required
                defaultValue={editingAddress.phoneNumber}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <AddressRegionFields
              idPrefix="edit-address"
              defaultProvince={editingAddress.province}
              defaultCity={editingAddress.city}
              defaultDistrict={editingAddress.district}
            />

            <div className="space-y-1">
              <label htmlFor="editPostalCode" className="text-sm font-medium text-gray-700">
                Kode Pos
              </label>
              <input
                id="editPostalCode"
                name="postalCode"
                type="text"
                required
                pattern="\d{4,10}"
                defaultValue={editingAddress.postalCode}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="editAddressLine" className="text-sm font-medium text-gray-700">
                Alamat Lengkap
              </label>
              <textarea
                id="editAddressLine"
                name="addressLine"
                required
                rows={3}
                defaultValue={editingAddress.addressLine}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="editAdditionalInfo" className="text-sm font-medium text-gray-700">
                Detail Lainnya (opsional)
              </label>
              <textarea
                id="editAdditionalInfo"
                name="additionalInfo"
                rows={2}
                defaultValue={editingAddress.additionalInfo ?? ""}
                placeholder="Contoh: Patokan rumah warna hijau, blok B nomor 3"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <a
                href="/account"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                Batal
              </a>
              <button type="submit" className="btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : null}

        <form method="POST" action="/api/account/addresses" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/account" />

          <h3 className="md:col-span-2 text-lg font-semibold text-gray-900">Tambah alamat baru</h3>

          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <AddressRegionFields idPrefix="new-address" />

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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
