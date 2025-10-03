import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const form = await req.formData();
  const orderItemId = String(form.get('orderItemId') || '');
  const reason = String(form.get('reason') || '');
  const order = await prisma.order.findUnique({ where: { orderCode: params.code } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item || item.orderId !== order.id) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  await prisma.returnRequest.create({ data: { orderId: order.id, orderItemId: item.id, reason } });
  await prisma.verificationLog.create({ data: { orderId: order.id, actor: 'buyer:unknown', action: 'return_request', note: `${item.id}` } });
  return NextResponse.redirect(new URL(`/order/${order.orderCode}`, req.url));
}
