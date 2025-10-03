import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sessionOptions, SessionUser } from "@/lib/session";
import { getIronSession } from "iron-session";

export default async function SellerReturns() {
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

  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
    where: { orderItem: { sellerId: user.id } },
    include: { order: true, orderItem: { include: { product: true } } }
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Retur Masuk</h1>
      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Tanggal</th><th>Order</th><th>Produk</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{new Date(r.createdAt).toLocaleString('id-ID')}</td>
                <td>{r.order.orderCode}</td>
                <td>{r.orderItem.product.title}</td>
                <td>{r.reason}</td>
                <td>{r.status}</td>
                <td>
                  <form method="POST" action={`/api/seller/returns/${r.id}/update`} className="inline-block mr-2">
                    <input type="hidden" name="status" value="APPROVED" /><button className="btn-outline">Approve</button>
                  </form>
                  <form method="POST" action={`/api/seller/returns/${r.id}/update`} className="inline-block mr-2">
                    <input type="hidden" name="status" value="REJECTED" /><button className="btn-outline">Reject</button>
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
