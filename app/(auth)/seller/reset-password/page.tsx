import type { Metadata } from "next";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { SellerAuthLayout } from "@/components/SellerAuthLayout";
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
    <SellerAuthLayout
      badge="Reset Password"
      title="Buat password baru"
      description="Masukkan password baru Anda. Tautan reset hanya berlaku selama 30 menit setelah diterbitkan."
      heroTitle="Jaga keamanan akun"
      heroSubtitle="Password kuat, transaksi aman"
      heroDescription="Gunakan kombinasi huruf, angka, dan simbol untuk melindungi akun seller Anda dari akses tidak sah."
      heroHighlights={[
        "Gunakan password unik yang tidak dipakai di platform lain.",
        "Perbarui password Anda secara berkala untuk keamanan maksimal.",
        "Hubungi support kami jika membutuhkan bantuan tambahan.",
      ]}
      footer={
        <span>
          Sudah selesai?{" "}
          <a href="/seller/login" className="font-semibold text-sky-700 hover:text-sky-900">
            Kembali ke login
          </a>
        </span>
      }
    >
      <ResetPasswordForm token={token} isTokenValid={isTokenValid} invalidReason={invalidReason} />
    </SellerAuthLayout>
  );
}
