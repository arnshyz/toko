'use client';
import { useEffect, useState } from "react";
type CartItem = { productId: string; title: string; price: number; qty: number; imageUrl?: string; sellerId: string };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const raw = localStorage.getItem('cart');
    const arr: CartItem[] = raw ? JSON.parse(raw) : [];
    setItems(arr); setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }, []);
  function updateQty(id: string, qty: number) {
    const arr = items.map(it => it.productId === id ? { ...it, qty } : it);
    setItems(arr); localStorage.setItem('cart', JSON.stringify(arr));
    setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }
  function removeItem(id: string) {
    const arr = items.filter(it => it.productId !== id);
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
          return (
            <tr key={it.productId} className="border-b">
              <td className="py-2"><div className="font-medium">{it.title}</div></td>
              <td>Rp {new Intl.NumberFormat('id-ID').format(it.price)}</td>
              <td><input type="number" min={1} value={it.qty} onChange={(e)=>updateQty(it.productId, Math.max(1, parseInt(e.target.value||'1')))} className="border rounded px-2 py-1 w-16"/></td>
              <td>Rp {new Intl.NumberFormat('id-ID').format(sub)}</td>
              <td><button className="px-3 py-1 text-red-600" onClick={()=>removeItem(it.productId)}>Hapus</button></td>
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
