import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { productCategories, getCategoryInfo } from "@/lib/categories";

export const dynamic = 'force-dynamic';

export default async function SellerProducts() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Produk Saya</h1>
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

  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: 'desc' }, include: { warehouse: true } }),
    prisma.warehouse.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' } })
  ]);

  const categoryLabel = (slug: string) => getCategoryInfo(slug)?.name ?? slug.replace(/-/g, ' ');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Produk Saya</h1>
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Tambah Produk</h2>
        <form
          method="POST"
          action="/api/seller/products/create"
          encType="multipart/form-data"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <select name="category" required className="border rounded px-3 py-2 md:col-span-2">
            <option value="">Pilih Kategori Produk</option>
            {productCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.emoji} {category.name}
              </option>
            ))}
          </select>
          <select name="warehouseId" className="border rounded px-3 py-2 md:col-span-2">
            <option value="">Pilih Gudang (opsional)</option>
            {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name} {w.city?`- ${w.city}`:''}</option>))}
          </select>
          <input name="title" required placeholder="Judul produk" className="border rounded px-3 py-2"/>
          <input name="price" required type="number" placeholder="Harga (integer)" className="border rounded px-3 py-2"/>
          <input
            name="originalPrice"
            type="number"
            placeholder="Harga sebelum diskon (opsional)"
            className="border rounded px-3 py-2"
          />
          <input name="stock" type="number" placeholder="Stok" className="border rounded px-3 py-2"/>
          <label className="md:col-span-2 text-sm">
            <span className="mb-1 block font-medium">Gambar Produk</span>
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="w-full rounded border px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Unggah hingga 5 gambar. Gambar pertama akan menjadi thumbnail utama.
            </span>
          </label>
          <textarea name="description" placeholder="Deskripsi" className="border rounded px-3 py-2 md:col-span-2"></textarea>
          <textarea
            name="variants"
            placeholder="Varian (contoh: Warna: Hitam, Putih)\nUkuran: 64GB, 128GB"
            className="border rounded px-3 py-2 md:col-span-2"
          ></textarea>
          <p className="text-xs text-gray-500 md:col-span-2">
            Tambahkan setiap kelompok varian di baris baru dengan format <span className="font-medium">Nama: opsi1, opsi2</span>.
          </p>
          <button className="btn-primary md:col-span-2">Simpan</button>
        </form>
      </div>
      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Harga Coret</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.title}<div className="text-xs text-gray-500">{p.warehouse ? `Gudang: ${p.warehouse.name}` : 'Gudang: -'}</div></td>
                <td>{categoryLabel(p.category)}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(p.price)}</td>
                <td>{p.originalPrice ? `Rp ${new Intl.NumberFormat('id-ID').format(p.originalPrice)}` : '-'}</td>
                <td>{p.stock}</td>
                <td><span className={`badge ${p.isActive ? 'badge-paid':'badge-pending'}`}>{p.isActive ? 'Aktif':'Nonaktif'}</span></td>
                <td className="space-x-2">
                  <form method="POST" action={`/api/seller/products/update/${p.id}`} className="inline">
                    <input type="hidden" name="toggle" value="1"/>
                    <button className="btn-outline">{p.isActive ? 'Nonaktifkan':'Aktifkan'}</button>
                  </form>
                  <form method="POST" action={`/api/seller/products/delete/${p.id}`} className="inline" >
                    <button className="px-3 py-1 text-red-600">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
