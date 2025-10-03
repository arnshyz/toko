import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { seller: true }
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Produk Terbaru</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <a key={p.id} href={`/product/${p.id}`} className="border bg-white rounded-lg overflow-hidden hover:shadow">
            <img src={p.imageUrl || 'https://placehold.co/600x400?text=Produk'} className="w-full h-40 object-cover" />
            <div className="p-3">
              <div className="font-medium line-clamp-1">{p.title}</div>
              <div className="text-sm text-gray-500">Seller: <a className="underline" href={`/s/${p.seller.slug}`}>{p.seller.name}</a></div>
              <div className="mt-1 font-semibold">Rp {formatIDR(p.price)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
