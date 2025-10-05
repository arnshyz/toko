import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password Seller",
};

export default function SellerForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">Lupa Password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Masukkan email akun seller Anda. Kami akan mengirim kode OTP untuk reset password.
      </p>
      <div className="mt-4">
        <ForgotPasswordForm />
      </div>
      <div className="mt-6 text-center text-sm text-gray-600">
        Sudah ingat password? <a className="font-semibold text-indigo-600 hover:underline" href="/seller/login">Kembali ke login</a>
      </div>
    </div>
  );
}
