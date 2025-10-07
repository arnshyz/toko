import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrimaryProductImageSrc } from "@/lib/productImages";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const productId = String(form.get('productId') || '');
  const qty = parseInt(String(form.get('qty') || '1')) || 1;
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: 'asc' }, select: { id: true } } },
  });
  if (!p || !p.isActive) return new Response('Produk tidak ditemukan', { status: 404 });

  const thumbnail = getPrimaryProductImageSrc(p);

  const html = `<!doctype html><html><body>
<script>
try {
  var cart = JSON.parse(localStorage.getItem('cart')||'[]');
  if (!Array.isArray(cart)) cart = [];
  var idx = cart.findIndex(function(it){ return it && it.productId === ${JSON.stringify(p.id)}; });
  if (idx >= 0) { cart[idx].qty = (cart[idx].qty||0) + ${qty}; }
  else {
    cart.push({ productId: ${JSON.stringify(p.id)}, title: ${JSON.stringify(p.title)}, price: ${p.price}, qty: ${qty}, imageUrl: ${JSON.stringify(thumbnail)}, sellerId: ${JSON.stringify(p.sellerId)} });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  var totalQty = cart.reduce(function(sum, item){ return sum + (item && item.qty ? item.qty : 0); }, 0);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { totalQty: totalQty, items: cart } }));
} catch (err) {
  console.error('Failed to update cart', err);
}
var fallback = document.referrer || '/';
setTimeout(function(){ window.location.replace(fallback); }, 150);
</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
