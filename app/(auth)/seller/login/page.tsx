import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
    <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl bg-white/70 p-6 text-sky-900 shadow-2xl shadow-sky-900/10 ring-1 ring-white/60 backdrop-blur-lg lg:flex-row lg:p-12">
      <div className="relative hidden min-h-[460px] flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-10 text-white shadow-lg lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-sky-500 shadow-xl">
              A
            </div>
            <div>
              <p className="text-3xl font-semibold leading-tight">Masuk & kelola tokomu</p>
              <p className="text-lg text-white/80">Semua kebutuhan seller dalam satu layar.</p>
            </div>
          </div>
          <p className="max-w-sm text-base text-white/80">
            Tingkatkan performa toko dengan promo terbaru, pantau pesanan secara real time, dan bangun loyalitas pembeli setiap hari.
          </p>
        </div>
        <div className="space-y-4 text-sm text-white/90">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">1</span>
            Kelola katalog produk dan stok dengan mudah dari dashboard cerdas kami.
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">2</span>
            Analisis performa penjualan dan kampanye promosi yang relevan bagi tokomu.
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">3</span>
            Tersedia dukungan tim Akay Nusantara setiap hari untuk bantu perkembangan usaha.
          </div>
        </div>
        <div className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-sky-100 backdrop-blur lg:p-10">
        <div className="mb-6 space-y-2 text-sm font-medium uppercase tracking-wide text-sky-600">
          <span>Masuk seller</span>
          <span className="block h-px w-14 bg-sky-300" />
        </div>
        <h1 className="text-2xl font-semibold text-sky-900">Masuk ke akun seller Akay Nusantara</h1>
        <p className="mt-2 text-sm text-sky-700/80">
          Gunakan email atau nomor HP terdaftar untuk melanjutkan. Aktivasi toko tersedia setelah onboarding selesai.
        </p>

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

        <form method="POST" action="/api/auth/login" className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-sky-800">
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
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-sky-800">
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
