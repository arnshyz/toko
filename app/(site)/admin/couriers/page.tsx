import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminCouriersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;
  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const couriers = await prisma.courier.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin: Kelola Kurir Pengiriman</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link className="link" href="/admin/categories">
            Kelola Kategori Produk
          </Link>
          <Link className="link" href="/admin/products">
            &larr; Kembali ke produk
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
        <h2 className="text-lg font-semibold">Tambah Kurir</h2>
        <form method="POST" action="/api/admin/couriers/create" className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Nama Kurir
            <input name="label" required className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="Nama" />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Kode (unik)
            <input name="key" className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="contoh: JNE_REG" />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Tarif Cadangan (IDR)
            <input
              name="fallbackCost"
              type="number"
              min={0}
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Kode RajaOngkir
            <input
              name="rajaOngkirCourier"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="contoh: jne"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Layanan RajaOngkir
            <input
              name="rajaOngkirService"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="contoh: REG"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Urutan
            <input name="sortOrder" type="number" className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="0" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary text-xs">
              Tambah Kurir
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Kode</th>
              <th className="px-3 py-2">Tarif Cadangan</th>
              <th className="px-3 py-2">RajaOngkir</th>
              <th className="px-3 py-2">Urutan</th>
              <th className="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((courier) => (
              <tr key={courier.id} className="border-b">
                <td className="px-3 py-2">
                  <div className="font-medium">{courier.label}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{courier.key}</td>
                <td className="px-3 py-2 text-xs">Rp {courier.fallbackCost.toLocaleString("id-ID")}</td>
                <td className="px-3 py-2 text-xs">
                  {courier.rajaOngkirCourier.toUpperCase()} • {courier.rajaOngkirService.toUpperCase()}
                </td>
                <td className="px-3 py-2 text-xs">{courier.sortOrder}</td>
                <td className="px-3 py-2">
                  <form method="POST" action={`/api/admin/couriers/${courier.id}/delete`}>
                    <button type="submit" className="btn-outline text-xs">
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {couriers.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-gray-500" colSpan={6}>
                  Belum ada kurir yang aktif.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
