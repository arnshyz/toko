import Link from "next/link";

import { ProfileChangeField } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const storeBadges = ["BASIC", "STAR", "STAR_PLUS", "MALL", "PREMIUM"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;
  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const [users, pendingRequests] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true,
          },
        },
        warehouses: {
          select: {
            id: true,
          },
        },
        profileChangeRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.profileChangeRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            storeName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  function getRequestLabel(field: ProfileChangeField) {
    switch (field) {
      case ProfileChangeField.STORE_NAME:
        return "Nama Toko";
      case ProfileChangeField.EMAIL:
        return "Email";
      default:
        return field;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin: Manajemen Pengguna &amp; Seller</h1>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link className="link" href="/admin/products">
          Kelola Produk Seller
        </Link>
        <Link className="link" href="/admin/banners">
          Kelola Banner Promo
        </Link>
        <Link className="link" href="/admin/orders">
          Pantau Pesanan
        </Link>
      </div>
      {successMessage ? (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="bg-white border rounded p-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Nama</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Toko</th>
              <th>Produk</th>
              <th>Penjualan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const hasWarehouse = user.warehouses.length > 0;
              const isSeller = user._count.products > 0 || hasWarehouse;
              const storeDisplayName = user.storeName?.trim().length ? user.storeName : user.name;
              const pendingStoreName = user.profileChangeRequests.find(
                (request) => request.field === ProfileChangeField.STORE_NAME,
              );
              const pendingEmail = user.profileChangeRequests.find(
                (request) => request.field === ProfileChangeField.EMAIL,
              );
              return (
                <tr key={user.id} id={`user-${user.id}`} className="border-b align-top">
                  <td className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            user.avatarUrl?.trim()
                              ? user.avatarUrl
                              : "https://placehold.co/96x96?text=Foto"
                          }
                          alt={user.name ?? "Foto profil"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-600">Nama Toko: {storeDisplayName}</div>
                        <div className="text-xs text-gray-500">
                          Bergabung {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </div>
                        {pendingStoreName ? (
                          <div className="mt-1 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Permintaan nama toko baru: {pendingStoreName.newValue}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div>{user.email}</div>
                    {pendingEmail ? (
                      <div className="mt-1 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        Permintaan email baru: {pendingEmail.newValue}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <span className={`badge ${user.isAdmin ? "badge-paid" : "badge-pending"}`}>
                      {user.isAdmin ? "ADMIN" : "USER"}
                    </span>
                  </td>
                  <td className="py-3">
                    {isSeller ? (
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Badge</div>
                        <form
                          method="POST"
                          action={`/api/admin/users/${user.id}/store-badge`}
                          className="flex flex-col sm:flex-row sm:items-center gap-2"
                        >
                          <select
                            name="badge"
                            defaultValue={user.storeBadge}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {storeBadges.map((badge) => (
                              <option key={badge} value={badge}>
                                {badge}
                              </option>
                            ))}
                          </select>
                          <button className="btn-outline text-xs px-3 py-1">Simpan</button>
                        </form>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`badge ${user.storeIsOnline ? "badge-paid" : "badge-pending"}`}>
                            {user.storeIsOnline ? "Toko Aktif" : "Toko Tutup"}
                          </span>
                          <form
                            method="POST"
                            action={`/api/admin/users/${user.id}/toggle-store`}
                          >
                            <button className="link text-xs" type="submit">
                              {user.storeIsOnline ? "Tutup" : "Buka"}
                            </button>
                          </form>
                        </div>
                        <form
                          method="POST"
                          action={`/api/admin/users/${user.id}/delete-store`}
                          className="pt-1"
                        >
                          <button
                            className="text-xs rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                            type="submit"
                            disabled={user._count.orderItems > 0}
                            title={
                              user._count.orderItems > 0
                                ? "Tidak dapat menghapus toko karena memiliki riwayat penjualan"
                                : undefined
                            }
                          >
                            Hapus Toko
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Belum memiliki produk</div>
                    )}
                  </td>
                  <td className="py-3">{user._count.products}</td>
                  <td className="py-3">{user._count.orderItems}</td>
                  <td className="py-3 space-y-3">
                    <form
                      method="POST"
                      action={`/api/admin/users/${user.id}/toggle-admin`}
                      className="inline"
                    >
                      <button
                        className="btn-primary text-xs"
                        type="submit"
                        disabled={isCurrent}
                        title={isCurrent ? "Tidak dapat mengubah status admin sendiri" : undefined}
                      >
                        {user.isAdmin ? "Cabut Admin" : "Jadikan Admin"}
                      </button>
                    </form>
                    {isSeller ? (
                      <Link
                        className="link block text-xs"
                        href={`/admin/products?sellerId=${user.id}`}
                      >
                        Kelola produk seller
                      </Link>
                    ) : null}
                    <details className="rounded border bg-gray-50 p-2 text-xs">
                      <summary className="cursor-pointer font-semibold">
                        Edit data seller
                      </summary>
                      <form
                        method="POST"
                        action={`/api/admin/users/${user.id}/update-profile`}
                        className="mt-2 space-y-2"
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <label className="flex flex-col gap-1">
                            <span>Nama</span>
                            <input
                              className="rounded border px-2 py-1"
                              name="name"
                              defaultValue={user.name ?? ""}
                              required
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Nama Toko</span>
                            <input
                              className="rounded border px-2 py-1"
                              name="storeName"
                              defaultValue={storeDisplayName ?? ""}
                              required
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Email</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="email"
                              name="email"
                              defaultValue={user.email ?? ""}
                              required
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Slug</span>
                            <input
                              className="rounded border px-2 py-1"
                              name="slug"
                              defaultValue={user.slug ?? ""}
                              required
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Rating Toko</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="number"
                              name="storeRating"
                              step="0.1"
                              min="0"
                              max="5"
                              defaultValue={user.storeRating ?? ""}
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Jumlah Penilaian</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="number"
                              name="storeRatingCount"
                              min="0"
                              defaultValue={user.storeRatingCount}
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Followers</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="number"
                              name="storeFollowers"
                              min="0"
                              defaultValue={user.storeFollowers}
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Following</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="number"
                              name="storeFollowing"
                              min="0"
                              defaultValue={user.storeFollowing}
                            />
                          </label>
                          <label className="flex flex-col gap-1 sm:col-span-2">
                            <span>Foto Profil (URL)</span>
                            <input
                              className="rounded border px-2 py-1"
                              type="url"
                              name="avatarUrl"
                              placeholder="https://contoh.com/avatar.jpg"
                              defaultValue={user.avatarUrl ?? ""}
                            />
                            <span className="text-[11px] text-gray-500">
                              Kosongkan untuk menghapus foto profil.
                            </span>
                          </label>
                          <div className="sm:col-span-2">
                            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                              Pratinjau Foto Profil
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    user.avatarUrl?.trim()
                                      ? user.avatarUrl
                                      : "https://placehold.co/128x128?text=Foto"
                                  }
                                  alt={`Foto ${user.name ?? "profil"}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                Gunakan URL gambar langsung (https://).
                              </span>
                            </div>
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="storeIsOnline"
                            defaultChecked={user.storeIsOnline}
                          />
                          <span>Toko aktif</span>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span>Badge</span>
                          <select
                            name="badge"
                            defaultValue={user.storeBadge}
                            className="rounded border px-2 py-1"
                          >
                            {storeBadges.map((badge) => (
                              <option key={badge} value={badge}>
                                {badge}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button className="btn-primary w-full" type="submit">
                          Simpan Perubahan
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Permintaan Persetujuan Profil</h2>
            <p className="text-sm text-gray-500">
              Tinjau perubahan nama toko dan email yang diajukan seller sebelum disetujui.
            </p>
          </div>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="mt-4 rounded border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
            Belum ada permintaan perubahan yang menunggu persetujuan.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Pengguna</th>
                  <th>Perubahan</th>
                  <th>Nilai Saat Ini</th>
                  <th>Permintaan Baru</th>
                  <th>Diajukan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => {
                  const fieldLabel = getRequestLabel(request.field);
                  const currentValue =
                    request.field === ProfileChangeField.STORE_NAME
                      ? request.user.storeName?.trim().length
                        ? request.user.storeName
                        : request.user.name
                      : request.user.email;
                  return (
                    <tr key={request.id} className="border-b align-top">
                      <td className="py-3">
                        <div className="font-medium">{request.user.name}</div>
                        <div className="text-xs text-gray-500">ID: {request.user.id}</div>
                      </td>
                      <td className="py-3">{fieldLabel}</td>
                      <td className="py-3">
                        <span className="break-words text-gray-600">{currentValue}</span>
                      </td>
                      <td className="py-3">
                        <span className="break-words font-semibold text-gray-900">{request.newValue}</span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 space-y-2">
                        <form
                          method="POST"
                          action={`/api/admin/profile-requests/${request.id}/approve`}
                        >
                          <button
                            className="w-full rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
                            type="submit"
                          >
                            Setujui
                          </button>
                        </form>
                        <form
                          method="POST"
                          action={`/api/admin/profile-requests/${request.id}/reject`}
                        >
                          <button
                            className="w-full rounded border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                            type="submit"
                          >
                            Tolak
                          </button>
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
  );
}
