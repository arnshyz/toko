import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetLinkEmail } from "@/lib/email";
import {
  generatePasswordResetToken,
  PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES,
} from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ message: "Mohon isi email yang terdaftar." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Samarkan status agar tidak dapat digunakan untuk enumerasi akun.
      return NextResponse.json({ message: "Jika email terdaftar, kami telah mengirim tautan reset password." });
    }

    // Bersihkan token lama agar permintaan terbaru memiliki tautan tunggal yang berlaku.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const { token, tokenHash, expiresAt } = generatePasswordResetToken();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    try {
      const resetUrl = new URL("/seller/reset-password", req.nextUrl.origin);
      resetUrl.searchParams.set("token", token);

      await sendPasswordResetLinkEmail({
        email: user.email,
        name: user.name,
        resetUrl: resetUrl.toString(),
        expiresInMinutes: PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES,
      });
    } catch (emailError) {
      console.error("Gagal mengirim email reset password", emailError);
      return NextResponse.json(
        { message: "Kami tidak dapat mengirim email reset password. Silakan coba lagi nanti." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: "Jika email terdaftar, kami telah mengirim tautan reset password." });
  } catch (error) {
    console.error("Gagal memproses permintaan lupa password", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan di server. Silakan coba lagi beberapa saat lagi." },
      { status: 500 },
    );
  }
}
