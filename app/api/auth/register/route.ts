import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '');
  const email = String(form.get('email') || '').toLowerCase();
  const password = String(form.get('password') || '');
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, slug: slugify(name), isAdmin: false } });

  return NextResponse.redirect(new URL('/seller/login', req.url));
}


export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/seller/register', req.url));
}
