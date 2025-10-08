import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

export default async function SellerOrders() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
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

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Pesanan (Produk Saya)</h1>
        <div className="rounded border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
          Akses pesanan seller akan tersedia setelah proses onboarding selesai. Silakan cek panduan pada halaman
          <a className="ml-1 font-semibold underline" href="/seller/onboarding">
            onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    where: { items: { some: { sellerId: user.id } } },
    include: { items: { where: { sellerId: user.id }, include: { product: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pesanan (Produk Saya)</h1>
      <div className="space-y-4 md:hidden">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Belum ada pesanan untuk produk Anda.
          </div>
        ) : (
          orders.map((order) => {
            const subtotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
            return (
              <article
                key={order.id}
                className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <header className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(order.createdAt).toLocaleString("id-ID", { timeZone: JAKARTA_TIME_ZONE })}</span>
                    <span className="font-semibold text-gray-900">{order.orderCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Metode: {order.paymentMethod}</span>
                    <span className={`badge ${order.status === "PAID" ? "badge-paid" : "badge-pending"}`}>
                      {order.status}
                    </span>
                  </div>
                </header>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.product.title}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.qty} • Rp {new Intl.NumberFormat("id-ID").format(item.price)}
                          </p>
                        </div>
                        <span className={`badge ${item.status === "PENDING" ? "badge-pending" : "badge-paid"}`}>
                          {item.status}
                        </span>
                      </div>
                      <form
                        method="POST"
                        action="/api/seller/item-status"
                        className="mt-3 space-y-2"
                      >
                        <input type="hidden" name="orderCode" value={order.orderCode} />
                        <input type="hidden" name="orderItemId" value={item.id} />
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PACKED">PACKED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                        <button className="w-full rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm">
                          Simpan Status
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
                <footer className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-gray-900">
                    Subtotal Anda: Rp {new Intl.NumberFormat("id-ID").format(subtotal)}
                  </span>
                  <Link className="text-sky-600 underline" href={`/order/${order.orderCode}`}>
                    Lihat detail
                  </Link>
                </footer>
              </article>
            );
          })
        )}
      </div>
      <div className="hidden md:block">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Tanggal</th>
                <th>Kode</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Subtotal Saya</th>
                <th>Item</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const subtotal = o.items.reduce((s, it) => s + it.qty * it.price, 0);
                return (
                  <tr key={o.id} className="border-b">
                    <td className="py-2">{new Date(o.createdAt).toLocaleString("id-ID", { timeZone: JAKARTA_TIME_ZONE })}</td>
                    <td>{o.orderCode}</td>
                    <td>
                      <span className={`badge ${o.status === "PAID" ? "badge-paid" : "badge-pending"}`}>{o.status}</span>
                    </td>
                    <td>{o.paymentMethod}</td>
                    <td>Rp {new Intl.NumberFormat("id-ID").format(subtotal)}</td>
                    <td className="py-2 align-top">
                      <div className="space-y-3">
                        {o.items.map((item) => (
                          <div key={item.id} className="rounded border border-gray-100 bg-gray-50 px-3 py-2">
                            <div className="flex justify-between gap-3">
                              <div>
                                <div className="font-medium">{item.product.title}</div>
                                <div className="text-xs text-gray-500">
                                  Qty: {item.qty} • Rp {new Intl.NumberFormat("id-ID").format(item.price)}
                                </div>
                              </div>
                              <span className={`badge ${item.status === "PENDING" ? "badge-pending" : "badge-paid"}`}>
                                {item.status}
                              </span>
                            </div>
                            <form
                              method="POST"
                              action="/api/seller/item-status"
                              className="mt-3 flex flex-col gap-2 md:flex-row md:items-center"
                            >
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
                    <td className="py-2 align-top">
                      <Link className="link" href={`/order/${o.orderCode}`}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
