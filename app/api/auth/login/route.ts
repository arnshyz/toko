import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppSessionFromRequest, getSafeRedirect } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').toLowerCase();
  const password = String(form.get('password') || '');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const defaultRedirect = user.isAdmin ? '/admin/orders' : '/seller/dashboard';
  const redirectTo = getSafeRedirect(form.get('redirect')?.toString() ?? null, defaultRedirect);

  const { session, res } = await getAppSessionFromRequest(req);
  session.user = { id: user.id, name: user.name, email: user.email, slug: user.slug, isAdmin: user.isAdmin };
  await session.save();
  res.headers.set('Location', redirectTo);
  res.status = 302;
  return res;
}


export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/seller/login', req.url));
}
