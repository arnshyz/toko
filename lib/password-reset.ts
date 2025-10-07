import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 30;

export function generatePasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
  );

  return { token, tokenHash, expiresAt };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findValidPasswordResetToken(token: string) {
  if (!token) return null;

  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!resetToken) return null;
  if (resetToken.usedAt) return null;
  if (resetToken.expiresAt < new Date()) return null;

  return resetToken;
}
