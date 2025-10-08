import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { SellerAuthLayout } from "@/components/SellerAuthLayout";

export const metadata: Metadata = {
  title: "Lupa Password Seller",
};

export default function SellerForgotPasswordPage() {
  return (
    <SellerAuthLayout
      badge="Reset Password"
      title="Lupa Password"
      description="Masukkan email akun seller Anda. Kami akan mengirim tautan reset password yang berlaku selama 30 menit."
      heroTitle="Butuh akses kembali?"
      heroSubtitle="Kami bantu pulihkan akun Anda"
      heroDescription="Tim support kami siap membantu Anda kembali mengelola toko dengan aman dan cepat."
      heroHighlights={[
        "Verifikasi aman melalui email terdaftar dalam hitungan menit.",
        "Panduan langkah demi langkah untuk membuat password baru.",
        "Dukungan tim support bila Anda memerlukan bantuan lanjutan.",
      ]}
      footer={
        <span>
          Sudah ingat password?{" "}
          <a href="/seller/login" className="font-semibold text-sky-700 hover:text-sky-900">
            Kembali ke login
          </a>
        </span>
      }
    >
      <ForgotPasswordForm />
    </SellerAuthLayout>
  );
}
