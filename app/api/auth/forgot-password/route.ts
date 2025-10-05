import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendPasswordResetOtpEmail } from "@/lib/email";

const OTP_EXPIRATION_MINUTES = 15;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ message: "Mohon isi email yang terdaftar." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Samarkan status agar tidak dapat digunakan untuk enumerasi akun.
    return NextResponse.json({ message: "Jika email terdaftar, kami telah mengirim OTP reset password." });
  }

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [
        { usedAt: { not: null } },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      otpHash,
      expiresAt,
    },
  });

  await sendPasswordResetOtpEmail({ email: user.email, name: user.name, otp });

  return NextResponse.json({ message: "Jika email terdaftar, kami telah mengirim OTP reset password." });
}
