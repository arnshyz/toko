import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sessionOptions, SessionUser } from "@/lib/session";
import { getIronSession } from "iron-session";
import { productCategories, getCategoryInfo } from "@/lib/categories";

export const dynamic = 'force-dynamic';

export default async function SellerProducts() {
  const cookieStore = cookies();
  // @ts-ignore
  const res = new Response();
  const session = await getIronSession<{ user?: SessionUser }>(
    { headers: { cookie: cookieStore.toString() } } as any,
    res as any,
    sessionOptions,
  );
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

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
        <form method="POST" action="/api/seller/products/create" className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <input name="imageUrl" placeholder="URL gambar" className="border rounded px-3 py-2"/>
          <textarea name="description" placeholder="Deskripsi" className="border rounded px-3 py-2 md:col-span-2"></textarea>
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
