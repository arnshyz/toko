import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const benefits = [
  "Analitik penjualan lengkap untuk keputusan yang lebih cepat.",
  "Dukungan kampanye pemasaran otomatis untuk tingkatkan eksposur.",
  "Tim support seller siap bantu setiap hari melalui live chat dan pusat bantuan.",
];

export default async function SellerLogin({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();

  if (session.user) {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { sellerOnboardingStatus: true },
    });
    if (!account || account.sellerOnboardingStatus !== "ACTIVE") {
      redirect("/seller/onboarding");
    }
    redirect("/seller/dashboard");
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
    <div className="grid gap-6 rounded-[40px] bg-white/20 p-3 shadow-[0_35px_90px_-45px_rgba(14,165,233,0.7)] backdrop-blur lg:grid-cols-[1.35fr_minmax(360px,420px)]">
      <div className="flex flex-col gap-8 rounded-[32px] bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-8 text-white shadow-2xl shadow-sky-900/20 lg:hidden">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/95 text-3xl font-bold text-sky-500 shadow-xl shadow-sky-900/30">
            A
          </div>
          <div>
            <p className="text-2xl font-semibold leading-tight">Akay Seller Center</p>
            <p className="text-base text-white/85">Lebih hemat, lebih cepat kelola tokomu.</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-white/85">
          Optimalkan performa toko dengan promo terbaru, pantau pesanan real time, dan bangun loyalitas pelanggan dari satu dashboard.
        </p>
        <ul className="space-y-2 text-sm text-white/80">
          {benefits.map((benefit, index) => (
            <li key={benefit} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">
                {index + 1}
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative hidden overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-10 text-white shadow-2xl shadow-sky-900/20 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/95 text-4xl font-bold text-sky-500 shadow-xl shadow-sky-900/30">
              A
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold leading-tight">Akay Seller Center</p>
              <p className="text-lg text-white/85">Lebih hemat, lebih cepat kelola tokomu.</p>
            </div>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-white/85">
            Optimalkan performa toko dengan promo terbaru, pantau pesanan real time, dan bangun loyalitas pelanggan dari satu dashboard.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">Kenapa bergabung dengan kami</h2>
          <ul className="space-y-3 text-sm text-white/85">
            {benefits.map((benefit, index) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white shadow-inner">
                  {index + 1}
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-none absolute -left-24 top-24 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-16 h-60 w-60 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center rounded-[32px] bg-white px-6 py-8 text-sky-900 shadow-xl shadow-sky-900/10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-4 border-b border-sky-100 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-sky-900">Log in seller</h1>
              <p className="mt-1 text-sm text-sky-700/80">Masuk menggunakan email atau nomor HP terdaftar.</p>
            </div>
            <span className="hidden rounded-full bg-sky-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 sm:inline-block">
              akun seller
            </span>
          </div>
          <p className="text-xs text-sky-600">Akses dashboard Akay Nusantara untuk mengelola katalog, pesanan, dan promosi.</p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {!errorMessage && infoMessage ? (
          <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/90 p-4 text-sm text-sky-700">
            {infoMessage}
          </div>
        ) : null}

        <form method="POST" action="/api/auth/login" className="mt-6 space-y-5">
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
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="/seller/forgot-password" className="font-semibold text-sky-600 transition hover:text-sky-800">
              Lupa password?
            </Link>
          </div>
          <button
            className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-white"
          >
            Log in
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-sky-300">
          <span className="h-px flex-1 bg-sky-200" />
          atau
          <span className="h-px flex-1 bg-sky-200" />
        </div>

        <div className="grid gap-3 text-sm">
          <button
            type="button"
            className="flex items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 font-medium text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
          >
            Masuk dengan Facebook
          </button>
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 text-center font-medium text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
          >
            Masuk dengan Google
          </a>
        </div>

        <div className="mt-6 text-center text-sm text-sky-700">
          Baru di Akay Nusantara?{" "}
          <Link href="/seller/register" className="font-semibold text-sky-600 transition hover:text-sky-800">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
