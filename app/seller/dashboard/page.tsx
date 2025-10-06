import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login sebagai seller.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, storeIsOnline: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard Seller</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun seller Anda telah diblokir oleh tim admin karena pelanggaran. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk proses banding atau informasi lebih lanjut.
        </div>
      </div>
    );
  }

  const storeIsOnline = account.storeIsOnline ?? false;

  const [pcount, orders, revenue] = await Promise.all([
    prisma.product.count({ where: { sellerId: user.id } }),
    prisma.orderItem.findMany({ where: { sellerId: user.id }, select: { orderId: true }, distinct: ["orderId"] }),
    prisma.orderItem.aggregate({ where: { sellerId: user.id, order: { status: 'PAID' } }, _sum: { price: true } })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Seller</h1>
      <div className="bg-white border rounded p-4 mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Status Toko</h2>
          <p className="text-sm text-gray-600">
            {storeIsOnline
              ? "Toko Anda sedang buka dan pelanggan dapat melakukan pembelian."
              : "Toko Anda sedang ditutup. Buka kembali agar pelanggan dapat berbelanja."}
          </p>
        </div>
        <form method="POST" action="/api/seller/store/toggle" className="flex-shrink-0">
          <input
            type="hidden"
            name="status"
            value={storeIsOnline ? "offline" : "online"}
          />
          <button className={storeIsOnline ? "btn-outline" : "btn-primary"}>
            {storeIsOnline ? "Tutup Toko" : "Buka Toko"}
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Produk</div><div className="text-2xl font-bold">{pcount}</div></div>
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Pesanan</div><div className="text-2xl font-bold">{orders.length}</div></div>
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Omzet (Paid)</div><div className="text-2xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(revenue._sum.price || 0)}</div></div>
      </div>
      <div className="mt-6 flex gap-2">
        <a className="btn-primary" href="/seller/products">Kelola Produk</a>
        <a className="btn-outline" href="/seller/orders">Pesanan Saya</a>
        <a className="btn-outline" href="/seller/warehouses">Gudang</a>
        <a className="btn-outline" href="/seller/returns">Retur</a>
        <a className="btn-outline" href={`/s/${user.slug}`} target="_blank">Lihat Toko</a>
      </div>
    </div>
  );
}
