import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

export default async function SellerOrders() {
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
        <h1 className="text-2xl font-semibold mb-4">Pesanan (Produk Saya)</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Anda tidak dapat mengelola pesanan karena akun sedang diblokir. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk klarifikasi lebih lanjut.
        </div>
      </div>
    );
  }

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
          <thead><tr className="text-left border-b"><th className="py-2">Tanggal</th><th>Kode</th><th>Status</th><th>Metode</th><th>Subtotal Saya</th><th>Item</th><th>Aksi</th></tr></thead>
          <tbody>
            {orders.map(o => {
              const subtotal = o.items.reduce((s, it) => s + it.qty*it.price, 0);
              return (
                <tr key={o.id} className="border-b">
                  <td className="py-2">{new Date(o.createdAt).toLocaleString('id-ID', { timeZone: JAKARTA_TIME_ZONE })}</td>
                  <td>{o.orderCode}</td>
                  <td><span className={`badge ${o.status === 'PAID' ? 'badge-paid':'badge-pending'}`}>{o.status}</span></td>
                  <td>{o.paymentMethod}</td>
                  <td>Rp {new Intl.NumberFormat('id-ID').format(subtotal)}</td>
                  <td className="py-2 align-top">
                    <div className="space-y-3">
                      {o.items.map(item => (
                        <div key={item.id} className="border rounded px-3 py-2 bg-gray-50">
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="font-medium">{item.product.title}</div>
                              <div className="text-xs text-gray-500">Qty: {item.qty} • Rp {new Intl.NumberFormat('id-ID').format(item.price)}</div>
                            </div>
                            <span className={`badge ${item.status === 'PENDING' ? 'badge-pending' : 'badge-paid'}`}>{item.status}</span>
                          </div>
                          <form method="POST" action="/api/seller/item-status" className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
                            <input type="hidden" name="orderCode" value={o.orderCode} />
                            <input type="hidden" name="orderItemId" value={item.id} />
                            <select name="status" defaultValue={item.status} className="border rounded px-3 py-2 text-sm">
                              <option value="PENDING">PENDING</option>
                              <option value="PACKED">PACKED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                            <button className="btn-primary text-sm">Update</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 align-top"><a className="link" href={`/order/${o.orderCode}`} target="_blank">Detail</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
