import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function SellerLogin({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();

  if (session.user) {
    redirect("/");
  }

  const errorParam =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const statusParam =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;

  let errorMessage: string | undefined;
  if (errorParam === "banned") {
    errorMessage =
      "Akun Anda telah diblokir oleh admin. Silakan hubungi support@akay.id untuk informasi lebih lanjut.";
  } else if (errorParam) {
    errorMessage = "Gagal masuk. Silakan coba lagi atau reset password Anda.";
  }

  const infoMessage =
    statusParam && !errorMessage
      ? "Akun Anda belum diaktifkan sebagai seller. Ikuti panduan onboarding untuk membuka toko."
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 text-sky-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-600">
          AKAY NUSANTARA
        </span>
        <h1 className="text-2xl font-semibold text-sky-900">Masuk ke akun seller</h1>
        <p className="max-w-sm text-sm text-sky-700/80">
          Gunakan email atau nomor HP terdaftar untuk mengakses semua fitur jualan di Akay Nusantara.
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
        {errorMessage ? (
          <div className="mb-5 rounded-2xl bg-red-100/70 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {!errorMessage && infoMessage ? (
          <div className="mb-5 rounded-2xl bg-sky-100/70 px-4 py-3 text-sm text-sky-800">
            {infoMessage}
          </div>
        ) : null}

        <form method="POST" action="/api/auth/login" className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-sky-800">
              Email atau nomor HP
            </label>
            <input
              id="email"
              type="text"
              name="email"
              required
              placeholder="contoh@email.com"
              className="w-full rounded-2xl bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-sky-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              placeholder="Masukkan password"
              className="w-full rounded-2xl bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
          </div>
          <div className="flex items-center justify-end text-sm">
            <Link href="/seller/forgot-password" className="font-semibold text-sky-600 transition hover:text-sky-800">
              Lupa password?
            </Link>
          </div>
          <button
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-sky-100"
          >
            Log in
          </button>
        </form>

        <div className="mt-6 space-y-3 text-sm">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/70 px-4 py-3 font-medium text-sky-700 transition hover:bg-white/90"
          >
            Masuk dengan Facebook
          </button>
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-center font-medium text-sky-700 transition hover:bg-white/90"
          >
            Masuk dengan Google
          </a>
        </div>
      </div>

      <div className="text-center text-sm text-sky-700">
        Baru di Akay Nusantara?{" "}
        <Link href="/seller/register" className="font-semibold text-sky-600 transition hover:text-sky-800">
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}
