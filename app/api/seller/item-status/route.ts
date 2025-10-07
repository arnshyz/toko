import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { sendOrderCompletedEmail, sendOrderShippedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const orderCode = String(form.get('orderCode') || '');
  const orderItemId = String(form.get('orderItemId') || '');
  const status = String(form.get('status') || 'PENDING') as any;


  const res = new NextResponse(null);

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });
  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL('/seller/login?error=banned', req.url));
  }

  if (account.sellerOnboardingStatus !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/seller/onboarding', req.url));
  }

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId }, include: { order: { include: { items: true } } } });
  if (!item || item.sellerId !== user.id || item.order.orderCode !== orderCode) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (item.status === status) {
    return NextResponse.redirect(new URL('/seller/orders', req.url));
  }

  await prisma.orderItem.update({ where: { id: item.id }, data: { status } });
  await prisma.verificationLog.create({ data: { orderId: item.orderId, actor: `seller:${user.email}`, action: 'update_item_status', note: `${item.id} -> ${status}` } });

  const order = item.order;
  if (order.buyerEmail) {
    const previousStatuses = order.items.map((it) => it.status);
    const statuses = order.items.map((it) => (it.id === item.id ? status : it.status));
    const allShippedOrDelivered = statuses.every((s) => s === 'SHIPPED' || s === 'DELIVERED');
    const allDelivered = statuses.every((s) => s === 'DELIVERED');
    const previouslyAllShippedOrDelivered = previousStatuses.every((s) => s === 'SHIPPED' || s === 'DELIVERED');
    const previouslyAllDelivered = previousStatuses.every((s) => s === 'DELIVERED');

    if (status === 'SHIPPED' && allShippedOrDelivered && !previouslyAllShippedOrDelivered) {
      try {
        await sendOrderShippedEmail({
          email: order.buyerEmail,
          name: order.buyerName,
          orderCode: order.orderCode,
        });
      } catch (error) {
        console.error('Failed to send order shipped email', error);
      }
    }

    if (status === 'DELIVERED' && allDelivered && !previouslyAllDelivered) {
      try {
        await sendOrderCompletedEmail({
          email: order.buyerEmail,
          name: order.buyerName,
          orderCode: order.orderCode,
        });
      } catch (error) {
        console.error('Failed to send order completed email', error);
      }
    }
  }

  return NextResponse.redirect(new URL('/seller/orders', req.url));
}
