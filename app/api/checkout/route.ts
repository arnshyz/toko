import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COURIERS } from "@/lib/shipping";
import { sendOrderCreatedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const buyerName = String(form.get('buyerName') || '');
  const buyerPhone = String(form.get('buyerPhone') || '');
  const buyerEmail = String(form.get('buyerEmail') || '').toLowerCase();
  const buyerAddress = String(form.get('buyerAddress') || '');
  const courierKey = String(form.get('courier') || 'JNE_REG') as keyof typeof COURIERS;
  const items = JSON.parse(String(form.get('items') || '[]')) as { productId: string; qty: number }[];
  const paymentMethod = String(form.get('paymentMethod') || 'TRANSFER') as 'TRANSFER'|'COD';
  const voucherCode = String(form.get('voucher') || '').trim().toUpperCase();

  if (!buyerName || !buyerPhone || !buyerAddress || !buyerEmail || !items.length) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  const courier = COURIERS[courierKey];
  const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
  if (products.length !== items.length) return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });

  let itemsTotal = 0;
  const createdItems: any[] = [];
  const usedWarehouses = new Set<string | 'default'>();
  for (const it of items) {
    const p = products.find(pp => pp.id === it.productId)!;
    itemsTotal += p.price * it.qty;
    createdItems.push({ productId: p.id, sellerId: p.sellerId, qty: it.qty, price: p.price });
    // @ts-ignore
    usedWarehouses.add(p.warehouseId || 'default');
  }

  const shipments = Math.max(1, usedWarehouses.size);
  const shippingCost = courier.cost * shipments;

  // Voucher
  let voucherDiscount = 0; let voucherUsed: string | null = null;
  if (voucherCode) {
    const v = await prisma.voucher.findUnique({ where: { code: voucherCode } });
    if (v && v.active && (!v.expiresAt || v.expiresAt > new Date()) && itemsTotal >= v.minSpend) {
      voucherUsed = v.code;
      if (v.kind === 'PERCENT') voucherDiscount = Math.floor(itemsTotal * (v.value/100));
      else voucherDiscount = Math.min(itemsTotal, v.value);
    }
  }

  const uniqueCode = paymentMethod === 'TRANSFER' ? Math.floor(111 + Math.random() * 888) : 0;
  const totalWithUnique = Math.max(0, itemsTotal - voucherDiscount) + shippingCost + uniqueCode;
  const orderCode = 'ORD-' + Math.random().toString(36).slice(2,10).toUpperCase();

  const order = await prisma.order.create({
    data: {
      orderCode,
      buyerName, buyerPhone, buyerAddress, buyerEmail,
      courier: courier.label,
      shippingCost,
      uniqueCode,
      itemsTotal,
      totalWithUnique,
      paymentMethod,
      voucherCode: voucherUsed,
      voucherDiscount,
      items: { create: createdItems }
    }
  });

  if (buyerEmail) {
    try {
      await sendOrderCreatedEmail({
        email: buyerEmail,
        name: buyerName,
        orderCode: order.orderCode,
        paymentMethod,
        total: order.totalWithUnique,
      });
    } catch (error) {
      console.error("Failed to send order created email", error);
    }
  }

  return NextResponse.json({ orderCode: order.orderCode });
}
