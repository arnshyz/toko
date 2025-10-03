import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '');
  const city = String(form.get('city') || '');
  // @ts-ignore
  const res = new NextResponse(null);
  // @ts-ignore
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.warehouse.create({ data: { ownerId: user.id, name, city: city || null } });
  return NextResponse.redirect(new URL('/seller/warehouses', req.url));
}
