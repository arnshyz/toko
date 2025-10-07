'use client';
import { COURIERS } from "@/lib/shipping";
import { useEffect, useState } from "react";
type CartItem = { productId: string; title: string; price: number; qty: number; sellerId: string };

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [courier, setCourier] = useState<keyof typeof COURIERS>('JNE_REG');

  useEffect(() => {
    const raw = localStorage.getItem('cart');
    const arr: CartItem[] = raw ? JSON.parse(raw) : [];
    setItems(arr); setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append('items', JSON.stringify(items));
    fd.append('courier', courier);
    const res = await fetch('/api/checkout', { method: 'POST', body: fd });
    if (!res.ok) { alert('Gagal membuat pesanan'); return; }
    const data = await res.json();
    localStorage.removeItem('cart');
    window.location.href = `/order/${data.orderCode}`;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Data Pembeli</h2>
        <form onSubmit={submit} className="space-y-3">
          <input name="buyerName" required placeholder="Nama Lengkap" className="border rounded w-full px-3 py-2"/>
          <input name="buyerPhone" required placeholder="No. WhatsApp (08xxxx)" className="border rounded w-full px-3 py-2"/>
          <input name="buyerEmail" type="email" required placeholder="Email" className="border rounded w-full px-3 py-2"/>
          <textarea name="buyerAddress" required placeholder="Alamat Lengkap" className="border rounded w-full px-3 py-2"/>
          <div>
            <label className="block text-sm mb-1">Kurir</label>
            <select value={courier} onChange={(e)=>setCourier(e.target.value as any)} className="border rounded w-full px-3 py-2">
              {Object.entries(COURIERS).map(([k,v]) => <option key={k} value={k}>{v.label} (Rp {new Intl.NumberFormat('id-ID').format(v.cost)})</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ongkir dihitung per gudang (per-shipment) di server.</p>
          </div>
          <div>
            <label className="block text-sm mb-1">Metode Pembayaran</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="paymentMethod" value="TRANSFER" defaultChecked/> Transfer Manual</label>
              <label className="flex items-center gap-2"><input type="radio" name="paymentMethod" value="COD"/> COD (Bayar di Tempat)</label>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Voucher</label>
            <input name="voucher" placeholder="KODEVOUCHER" className="border rounded w-full px-3 py-2"/>
            <p className="text-xs text-gray-500 mt-1">* Potongan diterapkan ke total barang (belum termasuk ongkir & kode unik).</p>
          </div>
          <button className="btn-primary">Buat Pesanan</button>
        </form>
      </div>
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Ringkasan</h2>
        <ul className="text-sm">
          {items.map(it => (
            <li key={it.productId} className="flex justify-between border-b py-1">
              <span>{it.title} × {it.qty}</span>
              <span>Rp {new Intl.NumberFormat('id-ID').format(it.price*it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="text-right mt-3 font-semibold">Total barang: Rp {new Intl.NumberFormat('id-ID').format(total)}</div>
        <p className="text-xs text-gray-500 mt-1">Total final termasuk ongkir & (jika transfer) kode unik akan muncul di halaman pesanan.</p>
      </div>
    </div>
  );
}
