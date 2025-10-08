import type { Metadata } from "next";
import Link from "next/link";

import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password Seller",
};

export default function SellerForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 text-sky-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-600">
          AKAY NUSANTARA
        </span>
        <h1 className="text-2xl font-semibold text-sky-900">Butuh reset password?</h1>
        <p className="max-w-sm text-sm text-sky-700/80">
          Masukkan email terdaftar dan kami akan mengirim tautan untuk membuat password baru.
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
        <ForgotPasswordForm />

        <div className="mt-6 text-sm text-sky-700">
          Sudah ingat password?{" "}
          <Link href="/seller/login" className="font-semibold text-sky-600 transition hover:text-sky-800">
            Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  );
}
