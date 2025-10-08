import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProductCategoryOptions } from "@/lib/categories";
import { stringifyVariantGroups } from "@/lib/product-form";

export const dynamic = 'force-dynamic';

export default async function SellerEditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const user = session.user;
  if (!user) {
    return <div>Harap login.</div>;
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Edit Produk</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun Anda sedang diblokir sehingga tidak dapat mengelola produk. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk bantuan lebih lanjut.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Edit Produk</h1>
        <div className="rounded border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
          Fitur manajemen produk tersedia setelah toko Anda diaktifkan. Selesaikan langkah onboarding pada halaman
          <a className="ml-1 font-semibold underline" href="/seller/onboarding">
            onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const [product, warehouses, categoryOptions] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, sellerId: user.id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        originalPrice: true,
        stock: true,
        weight: true,
        category: true,
        variantOptions: true,
        warehouseId: true,
        isActive: true,
      },
    }),
    prisma.warehouse.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    getProductCategoryOptions(),
  ]);

  if (!product) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Edit Produk</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Produk tidak ditemukan atau Anda tidak memiliki akses ke produk ini.
        </div>
        <Link href="/seller/products" className="btn-primary mt-4 inline-block">
          Kembali ke daftar produk
        </Link>
      </div>
    );
  }

  const variantText = stringifyVariantGroups(product.variantOptions);
  const errorMessageRaw = searchParams?.error;
  const errorMessage = Array.isArray(errorMessageRaw) ? errorMessageRaw[0] : errorMessageRaw;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Produk</h1>
        <Link href="/seller/products" className="text-sm text-blue-600 underline">
          &larr; Kembali ke Produk Saya
        </Link>
      </div>
      <div className="mb-4">
        <span className={`badge ${product.isActive ? "badge-paid" : "badge-pending"}`}>
          Status: {product.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      {errorMessage ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="rounded border bg-white p-4">
        <form method="POST" action={`/api/seller/products/update/${product.id}`} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="md:col-span-2 text-sm font-medium text-gray-700" htmlFor="title">
            Judul Produk
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={product.title}
            className="border rounded px-3 py-2 md:col-span-2"
          />
          <label className="text-sm font-medium text-gray-700" htmlFor="category">
            Kategori
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={product.category}
            className="border rounded px-3 py-2"
          >
            {categoryOptions.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.emoji} {category.parentName ? `${category.parentName} • ${category.name}` : category.name}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-700" htmlFor="warehouseId">
            Gudang
          </label>
          <select
            id="warehouseId"
            name="warehouseId"
            defaultValue={product.warehouseId ?? ""}
            className="border rounded px-3 py-2"
          >
            <option value="">Tidak ada gudang</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
                {warehouse.city ? ` - ${warehouse.city}` : ""}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-700" htmlFor="price">
            Harga (integer)
          </label>
          <input
            id="price"
            name="price"
            required
            type="number"
            defaultValue={product.price}
            className="border rounded px-3 py-2"
          />
          <label className="text-sm font-medium text-gray-700" htmlFor="originalPrice">
            Harga Sebelum Diskon (opsional)
          </label>
          <input
            id="originalPrice"
            name="originalPrice"
            type="number"
            defaultValue={product.originalPrice ?? ""}
            className="border rounded px-3 py-2"
          />
          <label className="text-sm font-medium text-gray-700" htmlFor="stock">
            Stok
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            defaultValue={product.stock}
            className="border rounded px-3 py-2"
          />
          <label className="text-sm font-medium text-gray-700" htmlFor="weight">
            Berat (gram)
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            min={1}
            defaultValue={product.weight ?? 1000}
            className="border rounded px-3 py-2"
            required
          />
          <label className="text-sm font-medium text-gray-700 md:col-span-2" htmlFor="description">
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product.description ?? ""}
            className="border rounded px-3 py-2 md:col-span-2 min-h-[120px]"
          ></textarea>
          <label className="text-sm font-medium text-gray-700 md:col-span-2" htmlFor="variants">
            Varian
          </label>
          <textarea
            id="variants"
            name="variants"
            defaultValue={variantText}
            placeholder={"Varian (contoh: Warna: Hitam, Putih)\nUkuran: 64GB, 128GB"}
            className="border rounded px-3 py-2 md:col-span-2 min-h-[120px]"
          ></textarea>
          <p className="text-xs text-gray-500 md:col-span-2">
            Tambahkan setiap kelompok varian di baris baru dengan format <span className="font-medium">Nama: opsi1, opsi2</span>.
          </p>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link href="/seller/products" className="btn-outline">
              Batal
            </Link>
            <button className="btn-primary" type="submit">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
