import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function buildErrorResponse() {
  return NextResponse.json({ error: "OTP atau email tidak valid." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").toLowerCase().trim();
  const otp = String(form.get("otp") || "").trim();
  const password = String(form.get("password") || "");

  if (!email || !otp || !password) {
    return NextResponse.json({ error: "Mohon lengkapi semua data." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return buildErrorResponse();
  }

  const activeToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activeToken || activeToken.expiresAt < new Date()) {
    return buildErrorResponse();
  }

  const matches = await bcrypt.compare(otp, activeToken.otpHash);
  if (!matches) {
    return buildErrorResponse();
  }

  const newPasswordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: activeToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        id: { not: activeToken.id },
      },
    }),
  ]);

  return NextResponse.json({ message: "Password berhasil diperbarui. Silakan login kembali." });
}
