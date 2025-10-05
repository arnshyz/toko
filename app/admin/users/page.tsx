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

  const users = await prisma.user.findMany({
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
    },
  });

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin: Manajemen Pengguna &amp; Seller</h1>
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
              return (
                <tr key={user.id} className="border-b align-top">
                  <td className="py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">Bergabung {new Date(user.createdAt).toLocaleDateString("id-ID")}</div>
                  </td>
                  <td className="py-3">{user.email}</td>
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
                  <td className="py-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
