import type { Metadata } from "next";
import Link from "next/link";

import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password Seller",
};

const reminders = [
  "Cek inbox email dan klik tautan reset dari Akay Nusantara.",
  "Buat password baru yang kuat agar akun tetap aman.",
  "Hubungi tim bantuan jika butuh pendampingan lanjutan.",
];

export default function SellerForgotPasswordPage() {
  return (
    <div className="grid gap-6 rounded-[40px] bg-white/20 p-3 shadow-[0_35px_90px_-45px_rgba(14,165,233,0.7)] backdrop-blur lg:grid-cols-[1.35fr_minmax(360px,420px)]">
      <div className="flex flex-col gap-8 rounded-[32px] bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-8 text-white shadow-2xl shadow-sky-900/20 lg:hidden">
        <h1 className="text-2xl font-semibold leading-tight">Reset akses akunmu</h1>
        <p className="text-sm leading-relaxed text-white/85">
          Masukkan email terdaftar dan kami akan mengirim tautan reset password yang berlaku selama 30 menit.
        </p>
        <ul className="space-y-2 text-sm text-white/80">
          {reminders.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative hidden overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-10 text-white shadow-2xl shadow-sky-900/20 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold leading-tight">Reset akses akunmu</h1>
          <p className="max-w-sm text-base text-white/85">
            Masukkan email terdaftar dan kami akan mengirim tautan reset password yang berlaku selama 30 menit.
          </p>
        </div>
        <ul className="space-y-4 text-sm text-white/90">
          {reminders.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute -left-24 top-24 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-16 h-60 w-60 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center rounded-[32px] bg-white px-6 py-8 text-sky-900 shadow-xl shadow-sky-900/10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-4 border-b border-sky-100 pb-6">
          <div>
            <h2 className="text-2xl font-semibold text-sky-900">Lupa password akun seller?</h2>
            <p className="mt-1 text-sm text-sky-700/80">
              Masukkan email terdaftar dan kami akan mengirim tautan reset password.
            </p>
          </div>
          <p className="text-xs text-sky-600">Tautan berlaku selama 30 menit. Demi keamanan, jangan bagikan tautan tersebut kepada siapapun.</p>
        </div>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>

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
