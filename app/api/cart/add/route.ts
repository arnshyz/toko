import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const productId = String(form.get('productId') || '');
  const qty = parseInt(String(form.get('qty') || '1')) || 1;
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p || !p.isActive) return new Response('Produk tidak ditemukan', { status: 404 });

  const html = `<!doctype html><html><body>
<script>
var cart = JSON.parse(localStorage.getItem('cart')||'[]');
var idx = cart.findIndex(it => it.productId === ${JSON.stringify(p.id)});
if (idx >= 0) { cart[idx].qty += ${qty}; }
else {
  cart.push({ productId: ${JSON.stringify(p.id)}, title: ${JSON.stringify(p.title)}, price: ${p.price}, qty: ${qty}, imageUrl: ${JSON.stringify(p.imageUrl||'')}, sellerId: ${JSON.stringify(p.sellerId)} });
}
localStorage.setItem('cart', JSON.stringify(cart));
location.href = '/cart';
</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
