import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const status = String(form.get('status') || '');
  // @ts-ignore
  const res = new NextResponse(null);
  // @ts-ignore
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rr = await prisma.returnRequest.findUnique({ where: { id: params.id }, include: { orderItem: true } });
  if (!rr || rr.orderItem.sellerId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.returnRequest.update({ where: { id: rr.id }, data: { status: status as any } });
  await prisma.verificationLog.create({ data: { orderId: rr.orderId, actor: `seller:${user.email}`, action: 'return_update', note: `${rr.id} -> ${status}` } });

  return NextResponse.redirect(new URL('/seller/returns', req.url));
}
