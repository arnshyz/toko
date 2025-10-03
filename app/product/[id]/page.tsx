import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { seller: true, warehouse: true } });
  if (!product) return <div>Produk tidak ditemukan</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <img src={product.imageUrl || 'https://placehold.co/800x600?text=Produk'} className="w-full rounded-lg border" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="text-sm text-gray-500">Seller: <a className="underline" href={`/s/${product.seller.slug}`}>{product.seller.name}</a></div>
        <div className="text-xs text-gray-500">{product.warehouse ? `Gudang: ${product.warehouse.name}${product.warehouse.city? ' - '+product.warehouse.city:''}` : 'Gudang: -'}</div>
        <div className="mt-2 text-xl font-bold">Rp {formatIDR(product.price)}</div>
        <p className="mt-3 text-gray-700">{product.description || ''}</p>
        <form className="mt-4" method="POST" action="/api/cart/add">
          <input type="hidden" name="productId" value={product.id} />
          <label className="block text-sm mb-1">Jumlah</label>
          <input type="number" name="qty" defaultValue={1} min={1} className="border rounded px-3 py-2 w-24" />
          <button className="ml-2 btn-primary">+ Keranjang</button>
        </form>
      </div>
    </div>
  );
}
