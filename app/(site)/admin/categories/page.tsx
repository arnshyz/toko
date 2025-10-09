import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;
  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const [categories] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        emoji: true,
        sortOrder: true,
        isActive: true,
        parentId: true,
        parent: { select: { name: true } },
      },
    }),
  ]);

  const parentOptions = categories.filter((category) => !category.parentId);
  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin: Kelola Kategori Produk</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link className="link" href="/admin/couriers">
            Kelola Kurir Pengiriman
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
        <h2 className="text-lg font-semibold">Tambah Kategori</h2>
        <p className="text-xs text-gray-500">
          Gunakan slug unik tanpa spasi. Jika tidak diisi, slug akan dibuat otomatis dari nama kategori.
        </p>
        <form method="POST" action="/api/admin/categories/create" className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Nama Kategori
            <input
              name="name"
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="Nama kategori"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Slug
            <input
              name="slug"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="opsional"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Emoji
            <input
              name="emoji"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="contoh: 🛍️"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Urutan
            <input
              name="sortOrder"
              type="number"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="0"
            />
          </label>
          <label className="md:col-span-2 text-xs font-medium uppercase tracking-wide text-gray-600">
            Deskripsi
            <textarea
              name="description"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              rows={3}
              placeholder="Deskripsi kategori"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Parent
            <select name="parentId" className="mt-1 w-full rounded border px-3 py-2 text-sm">
              <option value="">Tanpa parent (kategori utama)</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary text-xs">
              Tambah Kategori
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Emoji</th>
              <th className="px-3 py-2">Urutan</th>
              <th className="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b">
                <td className="px-3 py-2">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-gray-500">{category.description || "Tanpa deskripsi"}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{category.slug}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{category.parent?.name ?? "-"}</td>
                <td className="px-3 py-2">{category.emoji ?? "-"}</td>
                <td className="px-3 py-2 text-xs">{category.sortOrder}</td>
                <td className="px-3 py-2">
                  <form method="POST" action={`/api/admin/categories/${category.id}/delete`}>
                    <button type="submit" className="btn-outline text-xs">
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-gray-500" colSpan={6}>
                  Belum ada kategori.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
