import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sessionOptions, SessionUser } from "@/lib/session";
import { getIronSession } from "iron-session";

export default async function SellerOrders() {
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

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    where: { items: { some: { sellerId: user.id } } },
    include: { items: { where: { sellerId: user.id }, include: { product: true } } }
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Pesanan (Produk Saya)</h1>
      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Tanggal</th><th>Kode</th><th>Status</th><th>Metode</th><th>Subtotal Saya</th><th>Aksi</th></tr></thead>
          <tbody>
            {orders.map(o => {
              const subtotal = o.items.reduce((s, it) => s + it.qty*it.price, 0);
              return (
                <tr key={o.id} className="border-b">
                  <td className="py-2">{new Date(o.createdAt).toLocaleString('id-ID')}</td>
                  <td>{o.orderCode}</td>
                  <td><span className={`badge ${o.status === 'PAID' ? 'badge-paid':'badge-pending'}`}>{o.status}</span></td>
                  <td>{o.paymentMethod}</td>
                  <td>Rp {new Intl.NumberFormat('id-ID').format(subtotal)}</td>
                  <td><a className="link" href={`/order/${o.orderCode}`} target="_blank">Detail</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Update Status Item</h2>
        <form method="POST" action="/api/seller/item-status" className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input name="orderCode" required placeholder="Kode Pesanan (ORD-...)" className="border rounded px-3 py-2"/>
          <input name="orderItemId" required placeholder="OrderItem ID" className="border rounded px-3 py-2"/>
          <select name="status" className="border rounded px-3 py-2">
            <option value="PENDING">PENDING</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
          <button className="btn-primary">Update</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">* Dapatkan OrderItem ID di JSON order: /api/orders/ORD-XXXX</p>
      </div>
    </div>
  );
}
