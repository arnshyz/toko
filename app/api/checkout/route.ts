import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COURIERS } from "@/lib/shipping";
import { getSession } from "@/lib/session";
import { calculateFlashSalePrice } from "@/lib/flash-sale";
import { sendOrderCreatedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  let buyerName = String(form.get('buyerName') || '');
  let buyerPhone = String(form.get('buyerPhone') || '');
  let buyerEmail = String(form.get('buyerEmail') || '').toLowerCase();
  let buyerAddress = String(form.get('buyerAddress') || '');
  const courierKey = String(form.get('courier') || 'JNE_REG') as keyof typeof COURIERS;
  const items = JSON.parse(String(form.get('items') || '[]')) as { productId: string; qty: number }[];
  const paymentMethod = String(form.get('paymentMethod') || 'TRANSFER') as 'TRANSFER'|'COD';
  const voucherCode = String(form.get('voucher') || '').trim().toUpperCase();

  if (!items.length) {
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  }
  const courier = COURIERS[courierKey];
  const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
  if (products.length !== items.length) return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });

  const session = await getSession();
  const buyerId = session.user?.id ?? null;
  if (buyerId) {
    const account = await prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
          ],
          select: {
            fullName: true,
            phoneNumber: true,
            province: true,
            city: true,
            district: true,
            postalCode: true,
            addressLine: true,
            additionalInfo: true,
            isDefault: true,
          },
        },
      },
    });

    if (!account || account.addresses.length === 0) {
      return NextResponse.json(
        { error: 'Silakan tambahkan alamat pengiriman di Akun Saya sebelum melanjutkan checkout.' },
        { status: 400 },
      );
    }

    const defaultAddress =
      account.addresses.find((address) => address.isDefault) ?? account.addresses[0];

    if (!buyerName) {
      buyerName = defaultAddress.fullName || account.name;
    }
    if (!buyerPhone) {
      buyerPhone = defaultAddress.phoneNumber || account.phoneNumber || '';
    }
    if (!buyerEmail) {
      buyerEmail = account.email;
    }
    if (!buyerAddress) {
      const addressParts = [
        defaultAddress.addressLine,
        defaultAddress.district,
        defaultAddress.city,
        defaultAddress.province,
        defaultAddress.postalCode ? `Kode Pos ${defaultAddress.postalCode}` : '',
        defaultAddress.additionalInfo || '',
      ];
      buyerAddress = addressParts.filter(Boolean).join(', ');
    }

    const ownsProduct = products.some((product) => product.sellerId === buyerId);
    if (ownsProduct) {
      return NextResponse.json({ error: 'Penjual tidak dapat membeli produknya sendiri' }, { status: 400 });
    }
  }

  if (!buyerName || !buyerPhone || !buyerAddress || !buyerEmail) {
    return NextResponse.json({ error: 'Data pembeli tidak lengkap' }, { status: 400 });
  }

  const now = new Date();
  const flashSales = await prisma.flashSale.findMany({
    where: {
      productId: { in: products.map((product) => product.id) },
      startAt: { lte: now },
      endAt: { gte: now },
    },
    select: { productId: true, discountPercent: true },
  });

  const flashSaleMap = new Map<string, number>();
  for (const sale of flashSales) {
    const current = flashSaleMap.get(sale.productId) ?? 0;
    if (sale.discountPercent > current) {
      flashSaleMap.set(sale.productId, sale.discountPercent);
    }
  }

  let itemsTotal = 0;
  const createdItems: any[] = [];
  const usedWarehouses = new Set<string | 'default'>();
  for (const it of items) {
    const p = products.find(pp => pp.id === it.productId)!;
    const discountPercent = flashSaleMap.get(p.id);
    const unitPrice = discountPercent
      ? calculateFlashSalePrice(p.price, { discountPercent, startAt: now, endAt: now })
      : p.price;
    itemsTotal += unitPrice * it.qty;
    createdItems.push({ productId: p.id, sellerId: p.sellerId, qty: it.qty, price: unitPrice });
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
  const orderCode = 'AKAY-' + Math.random().toString(36).slice(2,10).toUpperCase();

  const order = await prisma.order.create({
    data: {
      orderCode,
      buyerName, buyerPhone, buyerAddress, buyerEmail,
      buyerId,
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
