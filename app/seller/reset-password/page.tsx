import type { Metadata } from "next";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password Seller",
};

export default function SellerResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">Reset Password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Masukkan email, kode OTP yang dikirim ke email Anda, dan password baru untuk menyelesaikan proses reset.
      </p>
      <div className="mt-4">
        <ResetPasswordForm />
      </div>
      <div className="mt-6 text-center text-sm text-gray-600">
        Sudah selesai? <a className="font-semibold text-indigo-600 hover:underline" href="/seller/login">Kembali ke login</a>
      </div>
    </div>
  );
}
