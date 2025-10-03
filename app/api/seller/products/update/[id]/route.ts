import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const toggle = String(form.get('toggle') || '');
  // @ts-ignore
  const res = new NextResponse(null);
  // @ts-ignore
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prod = await prisma.product.findUnique({ where: { id: params.id } });
  if (!prod || prod.sellerId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (toggle) {
    await prisma.product.update({ where: { id: prod.id }, data: { isActive: !prod.isActive } });
  }
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
