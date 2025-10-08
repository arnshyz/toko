import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerAuthLayout } from "@/components/SellerAuthLayout";
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
    <SellerAuthLayout
      badge="Log in"
      title="Masuk ke akun Akay Nusantara"
      description="Login untuk melanjutkan belanja Anda dan kelola tokomu dalam satu dashboard terintegrasi."
      heroTitle="Akay Nusantara"
      heroSubtitle="Lebih Hemat, Lebih Cepat"
      heroDescription="Nikmati pengalaman jual-beli yang aman dengan dukungan pengiriman cepat dan promo eksklusif setiap hari."
      heroHighlights={[
        "Promo kilat & voucher khusus seller pilihan setiap minggu.",
        "Pembayaran fleksibel lewat transfer manual, COD, dan dompet digital.",
        "Pantau pesanan, stok, dan performa toko langsung dari dashboard.",
      ]}
      footer={
        <span>
          Baru di Akay Nusantara?{" "}
          <Link href="/seller/register" className="font-semibold text-sky-700 hover:text-sky-900">
            Daftar sekarang
          </Link>
        </span>
      }
    >
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-inner">
          {errorMessage}
        </div>
      ) : null}
      {!errorMessage && infoMessage ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-700 shadow-inner">
          {infoMessage}
        </div>
      ) : null}
      <form method="POST" action="/api/auth/login" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email atau nomor HP
          </label>
          <input
            id="email"
            type="text"
            name="email"
            required
            placeholder="contoh@email.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            placeholder="Masukkan password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/seller/forgot-password" className="font-semibold text-sky-700 hover:text-sky-900">
            Lupa password?
          </Link>
        </div>
        <button
          className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-400/40 transition hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          Log in
        </button>
      </form>

      <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        atau
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3 text-sm">
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
        >
          Masuk dengan Facebook
        </button>
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
        >
          Masuk dengan Google
        </a>
      </div>
    </SellerAuthLayout>
  );
}
