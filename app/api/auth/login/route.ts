import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').toLowerCase();
  const password = String(form.get('password') || '');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  // @ts-ignore
  const res = new NextResponse(null, { status: 302, headers: { Location: '/seller/dashboard' } });
  // @ts-ignore
  const session = await getIronSession(req, res, sessionOptions);
  session.user = { id: user.id, name: user.name, email: user.email, slug: user.slug, isAdmin: user.isAdmin } as SessionUser;
  await session.save();
  return res;
}
