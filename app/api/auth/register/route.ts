import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').toLowerCase();
  const password = String(form.get('password') || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const localPart = email.split('@')[0] || 'seller';
  const defaultName = `Toko ${localPart}`.trim();
  const baseSlug = slugify(localPart) || 'seller';
  let slugCandidate = baseSlug;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { slug: slugCandidate } })) {
    slugCandidate = `${baseSlug}-${counter++}`;
  }

  await prisma.user.create({
    data: { name: defaultName, email, passwordHash, slug: slugCandidate, isAdmin: false },
  });

  return NextResponse.redirect(new URL('/seller/login', req.url));
}


export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/seller/register', req.url));
}
