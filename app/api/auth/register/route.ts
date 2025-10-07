import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const contactRaw = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const confirmPassword = String(form.get('confirmPassword') || '');

  const redirectWithMessage = (message: string) =>
    NextResponse.redirect(new URL(`/seller/register?error=${encodeURIComponent(message)}`, req.url));

  if (!name || !contactRaw || !password || !confirmPassword) {
    return redirectWithMessage('Semua kolom wajib diisi.');
  }

  if (password !== confirmPassword) {
    return redirectWithMessage('Konfirmasi password tidak cocok.');
  }

  if (password.length < 8) {
    return redirectWithMessage('Password minimal 8 karakter.');
  }

  const email = contactRaw.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return redirectWithMessage('Email atau nomor HP sudah terdaftar.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slugSource = slugify(name) || slugify(email.split('@')[0] || contactRaw) || 'akun-baru';
  let slugCandidate = slugSource;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { slug: slugCandidate } })) {
    slugCandidate = `${slugSource}-${counter++}`;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      slug: slugCandidate,
      isAdmin: false,
      sellerOnboardingStatus: 'NOT_STARTED',
    },
  });

  return NextResponse.redirect(new URL('/seller/register?success=1', req.url));
}


export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/seller/register', req.url));
}
