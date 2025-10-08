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
    <div className="mx-auto grid max-w-4xl gap-8 rounded-3xl bg-white/80 p-6 text-sky-900 shadow-2xl shadow-sky-900/10 ring-1 ring-white/60 backdrop-blur lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
      <div className="relative hidden flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-10 text-white shadow-lg lg:flex">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold leading-tight">Buat password seller baru</h1>
          <p className="max-w-sm text-base text-white/85">
            Demi keamanan akunmu, gunakan password unik dan jangan bagikan dengan siapapun.
          </p>
        </div>
        <ul className="space-y-4 text-sm text-white/90">
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">1</span>
            Pastikan token reset berasal dari email resmi Akay Nusantara dan masih berlaku.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">2</span>
            Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk keamanan ekstra.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">3</span>
            Update password Anda secara berkala untuk melindungi data dan transaksi pelanggan.
          </li>
        </ul>
        <div className="pointer-events-none absolute -left-14 top-24 h-36 w-36 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-16 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center rounded-2xl bg-white/90 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-sky-100 backdrop-blur md:p-10">
        <div className="space-y-2 text-sm font-medium uppercase tracking-wide text-sky-600">
          <span>Reset password</span>
          <span className="block h-px w-20 bg-sky-300" />
        </div>
        <p className="text-2xl font-semibold text-sky-900">Atur password baru Anda</p>
        <p className="mt-2 text-sm text-sky-700/80">
          Tautan reset berlaku selama 30 menit dan hanya bisa digunakan sekali.
        </p>
        <div className="mt-6">
          <ResetPasswordForm token={token} isTokenValid={isTokenValid} invalidReason={invalidReason} />
        </div>
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
