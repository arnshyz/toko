import OrderChat from "@/components/OrderChat";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function SellerOrderChat({ params }: { params: { code: string } }) {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

  const order = await prisma.order.findUnique({
    where: { orderCode: params.code },
    include: {
      items: {
        where: { sellerId: user.id },
        include: { product: true },
      },
    },
  });

  if (!order || order.items.length === 0) {
    return <div>Pesanan tidak ditemukan atau tidak terkait dengan toko Anda.</div>;
  }

  const buyerInfo = [order.buyerName?.trim(), order.buyerPhone?.trim()].filter(Boolean).join(" • ");
  const paymentMethod = String(order.paymentMethod);
  const midtransStatus = ((order as any).midtransStatus as string | null) ?? null;
  const midtransPaymentType = ((order as any).midtransPaymentType as string | null) ?? null;
  const midtransInfo = paymentMethod === "MIDTRANS" && midtransStatus
    ? `Midtrans: ${midtransStatus}${midtransPaymentType ? ` • ${midtransPaymentType}` : ""}`
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded p-4">
        <h1 className="text-xl font-semibold">Pesanan #{order.orderCode}</h1>
        <div className="mt-2 text-sm text-gray-600">{buyerInfo || "Data pembeli tidak tersedia"}</div>
        <div className="text-xs text-gray-500 mt-1">Metode bayar: {paymentMethod}{midtransInfo ? ` • ${midtransInfo}` : ""}</div>
        <div className="mt-4 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{item.product.title}</div>
              <div className="text-gray-500">Qty: {item.qty} • Rp {new Intl.NumberFormat("id-ID").format(item.price)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Chat dengan Pembeli</h2>
        <OrderChat orderCode={params.code} role="seller" />
      </div>
    </div>
  );
}
