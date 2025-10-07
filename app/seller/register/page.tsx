import Link from "next/link";

export default function SellerRegister({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const success = searchParams?.success === "1";
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams?.error : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-primary via-primary-bright to-primary-soft p-1 shadow-2xl">
        <div className="relative flex flex-col gap-10 rounded-[34px] bg-white/90 p-6 lg:flex-row lg:p-10">
          <div className="relative hidden min-h-[420px] flex-1 flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-primary to-primary-bright p-10 text-white lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-primary">
                  A
                </div>
                <div>
                  <div className="text-3xl font-semibold leading-tight">Gabung Akay Nusantara</div>
                  <div className="text-lg font-medium text-white/90">Mulai jualan lebih mudah</div>
                </div>
              </div>
              <p className="max-w-sm text-base text-white/80">
                Dapatkan akses ke jutaan pembeli, kampanye promosi, dan alat analitik untuk mengembangkan tokomu.
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">1</span>
                Buat etalase profesional dengan foto dan deskripsi lengkap.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">2</span>
                Kelola stok, pesanan, dan pengiriman dalam satu dashboard.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">3</span>
                Raih badge seller dan tingkatkan kepercayaan pembeli.
              </div>
            </div>
            <div className="pointer-events-none absolute -left-20 bottom-10 hidden h-40 w-40 rounded-full bg-white/10 blur-3xl lg:block" />
            <div className="pointer-events-none absolute -right-16 top-20 hidden h-48 w-48 rounded-full bg-white/10 blur-3xl lg:block" />
          </div>

          <div className="flex w-full max-w-md flex-col justify-center rounded-[28px] bg-white/80 p-6 shadow-xl backdrop-blur lg:p-10">
            <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
              <span>Daftar</span>
              <a
                href="mailto:support@akay.id"
                className="font-medium text-primary hover:text-primary-strong"
              >
                Butuh bantuan?
              </a>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Buat akun Akay Nusantara</h1>
            <p className="mt-2 text-sm text-gray-500">
              Daftar sebagai pembeli untuk menikmati promo terbaru. Aktivasi toko akan tersedia setelah mengikuti
              panduan onboarding seller.
            </p>

            {success ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-800 shadow-inner">
                <div className="flex items-center gap-3 text-emerald-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-semibold text-white">
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
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700"
                >
                  Lanjut ke halaman login
                </Link>
              </div>
            ) : (
              <>
                {errorMessage ? (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
                <form method="POST" action="/api/auth/register" className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nama Lengkap
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      required
                      placeholder="Masukkan nama Anda"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email atau Nomor HP
                    </label>
                    <input
                      id="email"
                      type="text"
                      name="email"
                      required
                      placeholder="contoh@email.com atau 0812xxxx"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                      placeholder="Minimal 8 karakter"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Verifikasi Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      required
                      placeholder="Ulangi password"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <button
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-[0_12px_30px_rgba(75,83,32,0.3)] transition hover:bg-primary-strong focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    Daftar sekarang
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
                    className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition hover:border-primary/40 hover:text-primary"
                  >
                    Daftar dengan Facebook
                  </button>
                  <a
                    href="/api/auth/google"
                    className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-medium text-gray-700 transition hover:border-primary/40 hover:text-primary"
                  >
                    Daftar dengan Google
                  </a>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Sudah punya akun?{" "}
                  <Link href="/seller/login" className="font-semibold text-primary hover:text-primary-strong">
                    Log in sekarang
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
