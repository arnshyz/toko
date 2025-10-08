import Link from "next/link";
import { SellerAuthLayout } from "@/components/SellerAuthLayout";

export default function SellerRegister({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const success = searchParams?.success === "1";
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams?.error : undefined;

  return (
    <SellerAuthLayout
      badge="Daftar"
      title="Buat akun Akay Nusantara"
      description="Nikmati promo terbaru dan kemudahan mengelola toko Anda dengan fitur lengkap seller kami."
      heroTitle="Gabung Akay Nusantara"
      heroSubtitle="Mulai jualan lebih mudah"
      heroDescription="Dapatkan akses ke jutaan pembeli, kampanye promosi, dan alat analitik untuk mengembangkan tokomu."
      heroHighlights={[
        "Buat etalase profesional dengan foto dan deskripsi terbaik.",
        "Kelola stok, pesanan, dan pengiriman dalam satu dashboard.",
        "Raih badge seller dan tingkatkan kepercayaan pembeli.",
      ]}
      footer={
        <span>
          Sudah punya akun?{" "}
          <Link href="/seller/login" className="font-semibold text-sky-700 hover:text-sky-900">
            Log in sekarang
          </Link>
        </span>
      }
    >
      {success ? (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-800 shadow-inner">
          <div className="flex items-start gap-3 text-emerald-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-base font-semibold text-white shadow-md shadow-emerald-400/40">
              ✓
            </span>
            <div>
              <p className="text-base font-semibold">Registrasi berhasil!</p>
              <p className="mt-1 text-sm text-emerald-700/90">
                Silakan login menggunakan akun Anda untuk mulai berbelanja di Akay Nusantara.
              </p>
            </div>
          </div>
          <Link
            href="/seller/login"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-600"
          >
            Lanjut ke halaman login
          </Link>
        </div>
      ) : (
        <>
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-inner">
              {errorMessage}
            </div>
          ) : null}
          <form method="POST" action="/api/auth/register" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                placeholder="Masukkan nama Anda"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email atau Nomor HP
              </label>
              <input
                id="email"
                type="text"
                name="email"
                required
                placeholder="contoh@email.com atau 0812xxxx"
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
                placeholder="Minimal 8 karakter"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Verifikasi Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                required
                placeholder="Ulangi password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <button
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-400/40 transition hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              Daftar sekarang
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
              Daftar dengan Facebook
            </button>
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
            >
              Daftar dengan Google
            </a>
          </div>
        </>
      )}
    </SellerAuthLayout>
  );
}
