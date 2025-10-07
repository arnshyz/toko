import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

export default async function AdminOrders() {
  const session = await getSession();
  const user = session.user;
  if (!user || !user.isAdmin) return <div>Admin only.</div>;

  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin: Semua Pesanan</h1>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <a className="link" href="/admin/users">
          Manajemen Pengguna
        </a>
        <a className="link" href="/admin/products">
          Kelola Produk Seller
        </a>
        <a className="link" href="/admin/banners">
          Kelola Banner Promo
        </a>
        <a className="link" href="/admin/vouchers">
          Kelola Voucher Publik
        </a>
      </div>
      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Tanggal</th><th>Kode</th><th>Status</th><th>Metode</th><th>Barang</th><th>Ongkir</th><th>Nominal</th><th>Aksi</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b">
                <td className="py-2">{new Date(o.createdAt).toLocaleString('id-ID', { timeZone: JAKARTA_TIME_ZONE })}</td>
                <td><a className="link" href={`/order/${o.orderCode}`} target="_blank">{o.orderCode}</a></td>
                <td><span className={`badge ${o.status === 'PAID' ? 'badge-paid':'badge-pending'}`}>{o.status}</span></td>
                <td>{o.paymentMethod}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(o.itemsTotal)}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(o.shippingCost)}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(o.totalWithUnique)}</td>
                <td className="space-y-2">
                  {o.status !== 'PAID' ? (
                    <form method="POST" action={`/api/admin/orders/${o.orderCode}/mark-paid`}>
                      <button className="btn-primary">Mark Paid</button>
                    </form>
                  ) : null}
                  {o.status !== 'CANCELLED' ? (
                    <form method="POST" action={`/api/admin/orders/${o.orderCode}/cancel`}>
                      <input type="hidden" name="reason" value="Pembatalan manual oleh admin" />
                      <button className="rounded bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-200">
                        Batalkan Pesanan
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
