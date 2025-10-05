import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { paymentTemplate, waLink } from "@/lib/wa";
import OrderChat from "@/components/OrderChat";

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: { code: string } }) {
  const order = await prisma.order.findUnique({ where: { orderCode: params.code }, include: { items: { include: { product: true } } } });
  if (!order) return <div>Pesanan tidak ditemukan.</div>;

  const waMsg = paymentTemplate({
    buyerName: order.buyerName,
    orderCode: order.orderCode,
    totalWithUnique: order.totalWithUnique,
    bankName: process.env.BANK_NAME!,
    accountName: process.env.ACCOUNT_NAME!,
    bankAccount: process.env.BANK_ACCOUNT!,
  });
  const wa = waLink(order.buyerPhone, waMsg);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Ringkasan Pembayaran</h1>
      <div className="bg-white border rounded p-4">
        <p className="mb-2">Kode Pesanan: <b>{order.orderCode}</b> {' '}
          <span className={`badge ${order.status==='PAID'?'badge-paid':'badge-pending'}`}>{order.status}</span>
        </p>
        <p>{order.paymentMethod==='TRANSFER' ? 'Silakan transfer manual ke rekening berikut sesuai nominal unik:' : 'Metode pembayaran: COD (Bayar di tempat).'}</p>
        {order.paymentMethod==='TRANSFER' && (<ul className="list-disc pl-5 my-2">
          <li>Bank: <b>{process.env.BANK_NAME}</b></li>
          <li>Atas Nama: <b>{process.env.ACCOUNT_NAME}</b></li>
          <li>No. Rekening: <b>{process.env.BANK_ACCOUNT}</b></li>
        </ul>)}

        <div className="mt-4 p-3 border rounded bg-amber-50">
          <div>Total barang: <b>Rp {formatIDR(order.itemsTotal)}</b></div>
          {order.voucherDiscount ? (<div>Voucher {order.voucherCode}: -<b>Rp {formatIDR(order.voucherDiscount)}</b></div>) : null}
          <div>Ongkir: <b>Rp {formatIDR(order.shippingCost)}</b></div>
          {order.paymentMethod==='TRANSFER' ? (<div>Kode unik: <b>{order.uniqueCode}</b></div>) : null}
          <div className="text-xl font-bold mt-1">Total dibayar: Rp {formatIDR(order.totalWithUnique)}</div>
        </div>

        <h2 className="font-semibold mt-4 mb-2">Detail Pesanan</h2>
        <ul className="text-sm">
          {order.items.map(it => (
            <li key={it.id} className="flex justify-between border-b py-1">
              <span>{it.product.title} × {it.qty}</span>
              <span>Rp {formatIDR(it.qty*it.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Retur (per item)</h3>
          <p className="text-xs text-gray-500 mb-2">Ajukan retur untuk item tertentu dengan alasan yang jelas.</p>
          {order.items.map(it => (
            <form key={it.id} method="POST" action={`/api/order/${order.orderCode}/return-request`} className="flex gap-2 items-center mb-2">
              <input type="hidden" name="orderItemId" value={it.id}/>
              <input name="reason" required placeholder={`Alasan retur: ${it.product.title}`} className="border rounded px-3 py-1 flex-1"/>
              <button className="btn-outline">Ajukan Retur</button>
            </form>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <a className="btn-outline" href="/">Kembali</a>
          <a className="btn-primary" href={`/api/orders/${order.orderCode}`} target="_blank">Lihat (JSON)</a>
          {order.paymentMethod==='TRANSFER' && (<a className="btn-primary" href={wa} target="_blank">Kirim Konfirmasi via WhatsApp</a>)}
        </div>
      </div>
 <div className="mt-6">
        <h2 className="font-semibold mb-2">Chat dengan Seller</h2>
        <OrderChat orderCode={params.code} role="buyer" />
      </div>
    </div>
    
      <div className="bg-white border rounded p-4 mt-6">
        <h2 className="font-semibold mb-2">Upload Bukti Transfer</h2>
        <form action={`/api/order/${order.orderCode}/upload-proof`} method="post" encType="multipart/form-data">
          <input type="file" name="file" accept="image/*" className="block mb-3"/>
          <button className="btn-primary">Upload</button>
        </form>
        {order.proofImage ? <p className="text-sm text-green-700 mt-2">Bukti sudah terunggah.</p> : null}
      </div>
    </div>
  {/* (opsional) chat */}
    {/* <OrderChat orderCode={params.code} role="buyer" /> */}
  </div>
);
}
