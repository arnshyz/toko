import type { Metadata } from "next";
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
    <div className="mx-auto max-w-md rounded border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">Reset Password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Masukkan password baru Anda. Tautan reset hanya berlaku selama 30 menit dan akan menjadi tidak valid setelah digunakan.
      </p>
      <div className="mt-4">
        <ResetPasswordForm token={token} isTokenValid={isTokenValid} invalidReason={invalidReason} />
      </div>
      <div className="mt-6 text-center text-sm text-gray-600">
        Sudah selesai? <a className="font-semibold text-indigo-600 hover:underline" href="/seller/login">Kembali ke login</a>
      </div>
    </div>
  );
}
