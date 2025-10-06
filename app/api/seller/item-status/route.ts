import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const orderCode = String(form.get('orderCode') || '');
  const orderItemId = String(form.get('orderItemId') || '');
  const status = String(form.get('status') || 'PENDING') as any;


  const res = new NextResponse(null);

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { isBanned: true } });
  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL('/seller/login?error=banned', req.url));
  }

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId }, include: { order: true } });
  if (!item || item.sellerId !== user.id || item.order.orderCode !== orderCode) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.orderItem.update({ where: { id: item.id }, data: { status } });
  await prisma.verificationLog.create({ data: { orderId: item.orderId, actor: `seller:${user.email}`, action: 'update_item_status', note: `${item.id} -> ${status}` } });

  return NextResponse.redirect(new URL('/seller/orders', req.url));
}
