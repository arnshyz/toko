import type { Metadata } from "next";
import Link from "next/link";

import ResetPasswordForm from "@/components/ResetPasswordForm";
import { findValidPasswordResetToken } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Reset Password Seller",
};

type SellerResetPasswordPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SellerResetPasswordPage({ searchParams }: SellerResetPasswordPageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? null;

  let isTokenValid = false;
  let invalidReason: string | undefined;

  if (token) {
    const resetToken = await findValidPasswordResetToken(token);
    if (resetToken) {
      isTokenValid = true;
    } else {
      invalidReason = "Token reset password tidak valid atau sudah kedaluwarsa.";
    }
  } else {
    invalidReason = "Token reset password tidak ditemukan. Gunakan tautan terbaru dari email Anda.";
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 text-sky-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-600">
          AKAY NUSANTARA
        </span>
        <h1 className="text-2xl font-semibold text-sky-900">Atur password seller baru</h1>
        <p className="max-w-sm text-sm text-sky-700/80">
          Demi keamanan, gunakan password unik dan jangan bagikan tautan reset kepada siapapun.
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
        <ResetPasswordForm token={token} isTokenValid={isTokenValid} invalidReason={invalidReason} />

        <div className="mt-6 text-sm text-sky-700">
          Sudah selesai?{" "}
          <Link href="/seller/login" className="font-semibold text-sky-600 transition hover:text-sky-800">
            Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  );
}
