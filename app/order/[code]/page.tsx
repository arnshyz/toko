// app/order/[code]/page.tsx
import { prisma } from "@/lib/prisma";
import OrderChat from "@/components/OrderChat";
import MidtransPayButton from "@/components/MidtransPayButton";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { code: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderCode: params.code },
    include: { items: { include: { product: true } } },
  });
  if (!order) return <div>Pesanan tidak ditemukan.</div>;

  const orderPaymentMethod = String(order.paymentMethod);
  const isMidtrans = orderPaymentMethod === "MIDTRANS";
  const midtransToken = (order as any).midtransToken as string | null;
  const midtransRedirectUrl = (order as any).midtransRedirectUrl as string | null;
  const midtransStatus = ((order as any).midtransStatus as string | null) ?? null;
  const midtransPaymentType = ((order as any).midtransPaymentType as string | null) ?? null;
  const formatted = new Intl.NumberFormat("id-ID");

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-lg">Order #{order.orderCode}</h1>
            <p className="text-sm text-gray-500">Dibuat pada {new Date(order.createdAt).toLocaleString("id-ID")}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-gray-500">Status Pesanan</div>
            <div className="text-base font-semibold">{order.status}</div>
            <div className="text-xs text-gray-500 mt-1">Metode: {orderPaymentMethod}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h2 className="font-semibold text-base">Detail Pengiriman</h2>
            <div className="rounded border px-3 py-2 text-sm">
              <div className="font-medium">{order.buyerName}</div>
              <div className="text-gray-600">{order.buyerPhone}</div>
              <div className="text-gray-600 mt-2 whitespace-pre-line">{order.buyerAddress}</div>
              <div className="text-gray-500 mt-3 text-xs">Kurir: {order.courier}</div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold text-base">Ringkasan Pembayaran</h2>
            <div className="rounded border px-3 py-2 text-sm space-y-2">
              <div className="flex justify-between"><span>Subtotal Barang</span><span>Rp {formatted.format(order.itemsTotal)}</span></div>
              <div className="flex justify-between"><span>Ongkir</span><span>Rp {formatted.format(order.shippingCost)}</span></div>
              {order.voucherDiscount > 0 ? (
                <div className="flex justify-between text-green-700"><span>Diskon Voucher</span><span>- Rp {formatted.format(order.voucherDiscount)}</span></div>
              ) : null}
              {order.uniqueCode > 0 ? (
                <div className="flex justify-between"><span>Kode Unik</span><span>Rp {formatted.format(order.uniqueCode)}</span></div>
              ) : null}
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total Dibayar</span>
                <span>Rp {formatted.format(order.totalWithUnique)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-base">Produk</h2>
          <div className="grid gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="border rounded px-3 py-2 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-medium">{item.product.title}</div>
                  <div className="text-gray-500">Qty: {item.qty} • Rp {formatted.format(item.price)}</div>
                </div>
                <div className="text-sm font-medium">Rp {formatted.format(item.price * item.qty)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isMidtrans ? (
        <div className="bg-white border rounded p-4 space-y-3">
          <h2 className="font-semibold text-base">Pembayaran Online</h2>
          <p className="text-sm text-gray-600">
            Status gateway: {midtransStatus ? midtransStatus.toUpperCase() : "PENDING"}
            {midtransPaymentType ? ` • Metode: ${midtransPaymentType}` : ""}
          </p>
          {order.status !== "PAID" ? (
            midtransToken ? (
              <div className="space-y-2">
                <MidtransPayButton
                  token={midtransToken}
                  orderCode={order.orderCode}
                  redirectUrl={midtransRedirectUrl ?? undefined}
                />
                {midtransRedirectUrl ? (
                  <p className="text-xs text-gray-500">
                    Jika pop-up pembayaran tidak muncul, klik
                    {" "}
                    <a className="link" href={midtransRedirectUrl} target="_blank" rel="noreferrer">
                      tautan pembayaran ini
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-red-600">Token pembayaran belum tersedia. Silakan hubungi admin.</p>
            )
          ) : (
            <p className="text-sm text-green-700 font-medium">Pembayaran selesai. Terima kasih!</p>
          )}
        </div>
      ) : orderPaymentMethod === "TRANSFER" ? (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Upload Bukti Transfer</h2>
          <form
            action={`/api/order/${order.orderCode}/upload-proof`}
            method="post"
            encType="multipart/form-data"
          >
            <input type="file" name="file" accept="image/*" className="block mb-3" />
            <button className="border rounded px-4 py-2 bg-green-800 text-white">Upload</button>
          </form>
        </div>
      ) : null}

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Chat dengan Seller</h2>
        <OrderChat orderCode={params.code} role="buyer" />
      </div>
    </div>
  );
}
