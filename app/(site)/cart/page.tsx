'use client';
import { useEffect, useState } from "react";
type CartItem = {
  productId: string;
  title: string;
  price: number;
  qty: number;
  imageUrl?: string;
  sellerId: string;
  note?: string | null;
  variants?: Record<string, string>;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const raw = localStorage.getItem('cart');
    const arr: CartItem[] = raw ? JSON.parse(raw) : [];
    setItems(arr); setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }, []);
  function updateQty(productId: string, note: string | null | undefined, qty: number) {
    const arr = items.map((it) =>
      it.productId === productId && (it.note ?? "") === (note ?? "")
        ? { ...it, qty }
        : it,
    );
    setItems(arr); localStorage.setItem('cart', JSON.stringify(arr));
    setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }
  function removeItem(productId: string, note: string | null | undefined) {
    const arr = items.filter((it) => !(it.productId === productId && (it.note ?? "") === (note ?? "")));
    setItems(arr); localStorage.setItem('cart', JSON.stringify(arr));
    setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }
  if (!items.length) return <div className="bg-white border rounded p-4">Keranjang kosong. <a className="link" href="/">Belanja sekarang</a></div>;
  return (
    <div className="bg-white border rounded p-4">
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Produk</th><th>Harga</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
        {items.map(it => {
          const sub = it.price * it.qty;
          const key = `${it.productId}::${it.note ?? ''}`;
          return (
            <tr key={key} className="border-b">
              <td className="py-2">
                <div className="font-medium">{it.title}</div>
                {it.note ? <div className="text-xs text-gray-500">Catatan: {it.note}</div> : null}
              </td>
              <td>Rp {new Intl.NumberFormat('id-ID').format(it.price)}</td>
              <td><input type="number" min={1} value={it.qty} onChange={(e)=>updateQty(it.productId, it.note ?? null, Math.max(1, parseInt(e.target.value||'1')))} className="border rounded px-2 py-1 w-16"/></td>
              <td>Rp {new Intl.NumberFormat('id-ID').format(sub)}</td>
              <td><button className="px-3 py-1 text-sky-600 transition hover:text-sky-500" onClick={()=>removeItem(it.productId, it.note ?? null)}>Hapus</button></td>
            </tr>
          );
        })}
        </tbody>
      </table>
      <div className="text-right mt-4">
        <div className="text-lg font-semibold">Total: Rp {new Intl.NumberFormat('id-ID').format(total)}</div>
        <a href="/checkout" className="inline-block mt-2 btn-primary">Lanjut Checkout</a>
      </div>
    </div>
  );
}
