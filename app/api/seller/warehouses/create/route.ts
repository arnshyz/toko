import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '');
  const city = String(form.get('city') || '');

  const res = new NextResponse(null);

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { isBanned: true } });
  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL('/seller/login?error=banned', req.url));
  }

  await prisma.warehouse.create({ data: { ownerId: user.id, name, city: city || null } });
  return NextResponse.redirect(new URL('/seller/warehouses', req.url));
}
