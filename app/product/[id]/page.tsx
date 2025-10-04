import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { getCategoryInfo } from "@/lib/categories";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { seller: true, warehouse: true } });
  if (!product) return <div>Produk tidak ditemukan</div>;

  const category = getCategoryInfo(product.category);
  const originalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : null;
  const showOriginal = originalPrice !== null && originalPrice > product.price;
  const categoryLabel = category?.name ?? product.category.replace(/-/g, ' ');
  const categoryEmoji = category?.emoji ?? '🏷️';

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <img src={product.imageUrl || 'https://placehold.co/800x600?text=Produk'} className="w-full rounded-lg border" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          <span>{categoryEmoji}</span>
          <span className="capitalize">{categoryLabel}</span>
        </div>
        <div className="text-sm text-gray-500">
          Seller:{' '}
          <a className="underline" href={`/s/${product.seller.slug}`}>
            {product.seller.name}
          </a>
        </div>
        <div className="text-xs text-gray-500">
          {product.warehouse
            ? `Gudang: ${product.warehouse.name}${product.warehouse.city ? ' - ' + product.warehouse.city : ''}`
            : 'Gudang: -'}
        </div>
        {showOriginal && (
          <div className="mt-2 text-sm text-gray-400 line-through">Rp {formatIDR(originalPrice)}</div>
        )}
        <div className="mt-1 text-2xl font-bold text-indigo-600">Rp {formatIDR(product.price)}</div>
        <p className="mt-3 text-gray-700">{product.description || ''}</p>
        <form className="mt-4" method="POST" action="/api/cart/add">
          <input type="hidden" name="productId" value={product.id} />
          <label className="mb-1 block text-sm">Jumlah</label>
          <input type="number" name="qty" defaultValue={1} min={1} className="w-24 rounded border px-3 py-2" />
          <button className="btn-primary ml-2">+ Keranjang</button>
        </form>
      </div>
    </div>
  );
}
