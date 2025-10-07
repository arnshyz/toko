import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

export default async function SellerReturns() {
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
        <h1 className="text-2xl font-semibold mb-4">Retur Masuk</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Anda tidak dapat memproses retur selama akun diblokir. Silakan hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk peninjauan akun.
        </div>
      </div>
    );
  }

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
                <td className="py-2">{new Date(r.createdAt).toLocaleString('id-ID', { timeZone: JAKARTA_TIME_ZONE })}</td>
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
