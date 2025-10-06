import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COURIERS } from "@/lib/shipping";
import {
  createMidtransTransaction,
  SnapItemDetail,
} from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const buyerName = String(form.get('buyerName') || '');
  const buyerPhone = String(form.get('buyerPhone') || '');
  const buyerAddress = String(form.get('buyerAddress') || '');
  const courierKey = String(form.get('courier') || 'JNE_REG') as keyof typeof COURIERS;
  const items = JSON.parse(String(form.get('items') || '[]')) as { productId: string; qty: number }[];
  const paymentMethod = String(form.get('paymentMethod') || 'TRANSFER') as 'TRANSFER'|'COD'|'MIDTRANS';
  const voucherCode = String(form.get('voucher') || '').trim().toUpperCase();

  if (!buyerName || !buyerPhone || !buyerAddress || !items.length) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  const courier = COURIERS[courierKey];
  const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
  if (products.length !== items.length) return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });

  let itemsTotal = 0;
  const createdItems: any[] = [];
  const midtransItems: SnapItemDetail[] = [];
  const usedWarehouses = new Set<string | 'default'>();
  for (const it of items) {
    const p = products.find(pp => pp.id === it.productId)!;
    itemsTotal += p.price * it.qty;
    createdItems.push({ productId: p.id, sellerId: p.sellerId, qty: it.qty, price: p.price });
    midtransItems.push({
      id: p.id,
      name: p.title.slice(0, 50),
      price: p.price,
      quantity: it.qty,
    });
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
  const payableTotal = Math.max(0, itemsTotal - voucherDiscount) + shippingCost;
  const totalWithUnique = payableTotal + uniqueCode;
  const orderCode = 'ORD-' + Math.random().toString(36).slice(2,10).toUpperCase();

  if (paymentMethod === 'MIDTRANS' && !process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: 'Pembayaran Midtrans belum dikonfigurasi' }, { status: 500 });
  }

  if (shippingCost > 0) {
    midtransItems.push({
      id: `SHIP-${courierKey}`,
      name: `Ongkir ${courier.label}`.slice(0, 50),
      price: shippingCost,
      quantity: 1,
    });
  }
  if (voucherDiscount > 0) {
    midtransItems.push({
      id: `DISC-${voucherUsed ?? 'voucher'}`.slice(0, 50),
      name: 'Diskon Voucher',
      price: -voucherDiscount,
      quantity: 1,
    });
  }

  let order;
  try {
    const orderData: any = {
      orderCode,
      buyerName, buyerPhone, buyerAddress,
      courier: courier.label,
      shippingCost,
      uniqueCode,
      itemsTotal,
      totalWithUnique,
      paymentMethod,
      voucherCode: voucherUsed,
      voucherDiscount,
      items: { create: createdItems }
    };

    order = await prisma.order.create({
      data: orderData,
    });

    if (paymentMethod === 'MIDTRANS') {
      const transaction = await createMidtransTransaction({
        transaction_details: {
          order_id: order.orderCode,
          gross_amount: payableTotal,
        },
        item_details: midtransItems,
        customer_details: {
          first_name: buyerName,
          phone: buyerPhone,
          shipping_address: {
            address: buyerAddress,
            phone: buyerPhone,
            first_name: buyerName,
          },
        },
        callbacks: {
          finish: `${req.nextUrl.origin}/order/${order.orderCode}`,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          midtransToken: transaction.token,
          midtransRedirectUrl: transaction.redirect_url,
          midtransStatus: 'pending',
        } as any,
      });

      return NextResponse.json({
        orderCode: order.orderCode,
        midtrans: transaction,
      });
    }

    return NextResponse.json({ orderCode: order.orderCode });
  } catch (err) {
    console.error('checkout_error', err);
    if (order) {
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    }
    return NextResponse.json({ error: 'Gagal memproses pesanan' }, { status: 500 });
  }
}
