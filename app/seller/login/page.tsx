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
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#f53d2d] via-[#ff7243] to-[#ff9061] p-1 shadow-2xl">
        <div className="relative flex flex-col gap-10 rounded-[34px] bg-white/90 p-6 lg:flex-row lg:p-10">
          <div className="relative hidden min-h-[420px] flex-1 flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f53d2d] to-[#ff6636] p-10 text-white lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-[#f53d2d]">
                  A
                </div>
                <div>
                  <div className="text-3xl font-semibold leading-tight">Akay Nusantara</div>
                  <div className="text-lg font-medium text-white/90">Lebih Hemat Lebih Cepat</div>
                </div>
              </div>
              <p className="max-w-sm text-base text-white/80">
                Nikmati promo terbaru, pengiriman cepat, dan pengalaman belanja yang aman setiap hari dengan Akay Nusantara.
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">1</span>
                Cek promo kilat dan diskon eksklusif seller pilihan.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">2</span>
                Bayar dengan aman via transfer manual, COD, atau dompet digital.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">3</span>
                Pantau pesanan dan kelola tokomu dari dashboard seller kami.
              </div>
            </div>
            <div className="pointer-events-none absolute -left-20 bottom-10 hidden h-40 w-40 rounded-full bg-white/10 blur-3xl lg:block" />
            <div className="pointer-events-none absolute -right-16 top-20 hidden h-48 w-48 rounded-full bg-white/10 blur-3xl lg:block" />
          </div>

          <div className="flex w-full max-w-md flex-col justify-center rounded-[28px] bg-white/80 p-6 shadow-xl backdrop-blur lg:p-10">
            <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
              <span>Masuk</span>
              <a
                href="mailto:support@akay.id"
                className="font-medium text-[#f53d2d] hover:text-[#d63b22]"
              >
                Butuh bantuan?
              </a>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Masuk ke akun Akay Nusantara</h1>
            <p className="mt-2 text-sm text-gray-500">
              Login untuk melanjutkan belanja Anda. Aktivasi toko tersedia setelah proses onboarding seller selesai.
            </p>

            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {!errorMessage && infoMessage ? (
              <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
                {infoMessage}
              </div>
            ) : null}
            <form method="POST" action="/api/auth/login" className="mt-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email atau nomor HP
                </label>
                <input
                  id="email"
                  type="text"
                  name="email"
                  required
                  placeholder="contoh@email.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/40"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  placeholder="Masukkan password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/40"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <Link href="/seller/forgot-password" className="font-medium text-[#f53d2d] hover:text-[#d63b22]">
                  Lupa password?
                </Link>
              </div>
              <button
                className="w-full rounded-xl bg-[#f53d2d] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#f53d2d]/30 transition hover:bg-[#e13a24] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/50"
              >
                Log in
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              atau
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid gap-3 text-sm">
              <button
                type="button"
                className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition hover:border-[#f53d2d]/40 hover:text-[#f53d2d]"
              >
                Masuk dengan Facebook
              </button>
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-medium text-gray-700 transition hover:border-[#f53d2d]/40 hover:text-[#f53d2d]"
              >
                Masuk dengan Google
              </a>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Baru di Akay Nusantara?{" "}
              <Link href="/seller/register" className="font-semibold text-[#f53d2d] hover:text-[#d63b22]">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
