import { prisma } from "@/lib/prisma";

export default async function Storefront({ params }: { params: { slug: string } }) {
  const seller = await prisma.user.findUnique({ where: { slug: params.slug } });
  if (!seller) return <div>Toko tidak ditemukan</div>;
  const products = await prisma.product.findMany({ where: { sellerId: seller.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Toko {seller.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <a key={p.id} href={`/product/${p.id}`} className="border bg-white rounded-lg overflow-hidden hover:shadow">
            <img src={p.imageUrl || 'https://placehold.co/600x400?text=Produk'} className="w-full h-40 object-cover" />
            <div className="p-3">
              <div className="font-medium line-clamp-1">{p.title}</div>
              <div className="mt-1 font-semibold">Rp {new Intl.NumberFormat('id-ID').format(p.price)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
