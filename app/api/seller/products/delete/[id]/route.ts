import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {

  const res = new NextResponse(null);

  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prod = await prisma.product.findUnique({ where: { id: params.id } });
  if (!prod || prod.sellerId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.product.delete({ where: { id: prod.id } });
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
