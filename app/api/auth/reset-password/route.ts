import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { sendPasswordResetSuccessEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { findValidPasswordResetToken } from "@/lib/password-reset";

function buildErrorResponse() {
  return NextResponse.json(
    { error: "Token reset password tidak valid atau sudah tidak berlaku." },
    { status: 400 },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return buildErrorResponse();
  }

  const resetToken = await findValidPasswordResetToken(token);

  if (!resetToken) {
    return buildErrorResponse();
  }

  return NextResponse.json({ message: "Token valid." });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") || "").trim();
  const password = String(form.get("password") || "");

  if (!token || !password) {
    return NextResponse.json({ error: "Mohon lengkapi semua data." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
  }

  const resetToken = await findValidPasswordResetToken(token);

  if (!resetToken) {
    return buildErrorResponse();
  }

  const newPasswordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      });

      const updateTokenResult = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash: resetToken.tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (updateTokenResult.count === 0) {
        throw new Error("PASSWORD_RESET_TOKEN_ALREADY_USED");
      }

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          tokenHash: { not: resetToken.tokenHash },
        },
      });
    });
  } catch (transactionError) {
    if (
      transactionError instanceof Error &&
      transactionError.message === "PASSWORD_RESET_TOKEN_ALREADY_USED"
    ) {
      return buildErrorResponse();
    }

    console.error("Gagal menyelesaikan transaksi reset password", transactionError);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui password. Silakan coba lagi." },
      { status: 500 },
    );
  }

  try {
    await sendPasswordResetSuccessEmail({
      email: resetToken.user.email,
      name: resetToken.user.name,
    });
  } catch (emailError) {
    console.error("Gagal mengirim email konfirmasi reset password", emailError);
  }

  return NextResponse.json({ message: "Password berhasil diperbarui. Silakan login kembali." });
}
