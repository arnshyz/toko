import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').toLowerCase();
  const password = String(form.get('password') || '');

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      isAdmin: true,
      isBanned: true,
      passwordHash: true,
    },
  });
  if (!user) {
    return NextResponse.redirect(new URL('/seller/login?error=invalid', req.url));
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL('/seller/login?error=invalid', req.url));
  }

  if (user.isBanned) {
    return NextResponse.redirect(new URL('/seller/login?error=banned', req.url));
  }

  const redirectTo = new URL('/', req.url);
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  session.user = { id: user.id, name: user.name, email: user.email, slug: user.slug, isAdmin: user.isAdmin };
  await session.save();
  const redirectResponse = NextResponse.redirect(redirectTo);
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      redirectResponse.headers.append(key, value);
    }
  });
  return redirectResponse;
}


export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/seller/login', req.url));
}
