import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;
  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const sellerIdFilter =
    typeof searchParams?.sellerId === "string" ? searchParams?.sellerId : undefined;

  const products = await prisma.product.findMany({
    where: sellerIdFilter ? { sellerId: sellerIdFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          slug: true,
        },
      },
      warehouse: {
        select: {
          name: true,
        },
      },
    },
  });

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin: Kelola Produk Seller</h1>
        <Link className="link text-sm" href="/admin/users">
          &larr; Kembali ke pengguna
        </Link>
      </div>
      <form className="flex flex-wrap items-end gap-2" method="GET">
        <label className="flex flex-col text-sm">
          <span className="font-medium">Filter Seller ID</span>
          <input
            className="rounded border px-2 py-1"
            name="sellerId"
            placeholder="Masukkan ID seller"
            defaultValue={sellerIdFilter ?? ""}
          />
        </label>
        <button className="btn-outline" type="submit">
          Terapkan
        </button>
        {sellerIdFilter ? (
          <Link className="link text-sm" href="/admin/products">
            Reset filter
          </Link>
        ) : null}
      </form>
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
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-[960px] w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Produk</th>
              <th>Seller</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b align-top">
                <td className="py-3">
                  <div className="font-medium">{product.title}</div>
                  <div className="text-xs text-gray-500">Kategori: {product.category}</div>
                  {product.warehouse ? (
                    <div className="text-xs text-gray-500">
                      Gudang: {product.warehouse.name}
                    </div>
                  ) : null}
                  <div className="text-xs text-gray-400">ID: {product.id}</div>
                </td>
                <td className="py-3 text-xs">
                  <div className="font-medium text-sm">{product.seller?.name}</div>
                  <div>{product.seller?.email}</div>
                  <div>Slug: {product.seller?.slug}</div>
                  <Link className="link" href={`/admin/users#user-${product.sellerId}`}>
                    Lihat seller
                  </Link>
                </td>
                <td className="py-3">Rp {product.price.toLocaleString("id-ID")}</td>
                <td className="py-3">{product.stock}</td>
                <td className="py-3">
                  <span className={`badge ${product.isActive ? "badge-paid" : "badge-pending"}`}>
                    {product.isActive ? "Aktif" : "Non-aktif"}
                  </span>
                </td>
                <td className="py-3">
                  <form
                    method="POST"
                    action={`/api/admin/products/${product.id}/update`}
                    className="space-y-2"
                  >
                    <input type="hidden" name="sellerId" value={sellerIdFilter ?? ""} />
                    <label className="flex flex-col gap-1 text-xs">
                      <span>Nama Produk</span>
                      <input
                        className="rounded border px-2 py-1"
                        name="title"
                        defaultValue={product.title}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span>Harga (IDR)</span>
                      <input
                        className="rounded border px-2 py-1"
                        type="number"
                        name="price"
                        min="0"
                        defaultValue={product.price}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span>Stok</span>
                      <input
                        className="rounded border px-2 py-1"
                        type="number"
                        name="stock"
                        min="0"
                        defaultValue={product.stock}
                        required
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={product.isActive}
                      />
                      <span>Produk aktif</span>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span>Kategori</span>
                      <input
                        className="rounded border px-2 py-1"
                        name="category"
                        defaultValue={product.category}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span>Deskripsi</span>
                      <textarea
                        className="min-h-[80px] rounded border px-2 py-1"
                        name="description"
                        defaultValue={product.description ?? ""}
                      />
                    </label>
                    <button className="btn-primary w-full text-xs" type="submit">
                      Simpan perubahan
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td className="py-4 text-center text-sm text-gray-500" colSpan={6}>
                  Tidak ada produk yang ditemukan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
