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
    <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl bg-white/70 p-6 text-sky-900 shadow-2xl shadow-sky-900/10 ring-1 ring-white/60 backdrop-blur-lg lg:flex-row lg:p-12">
      <div className="relative hidden min-h-[460px] flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 p-10 text-white shadow-lg lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-sky-500 shadow-xl">
              A
            </div>
            <div>
              <p className="text-3xl font-semibold leading-tight">Daftarkan tokomu hari ini</p>
              <p className="text-lg text-white/80">Mulai jualan lebih mudah dan cepat.</p>
            </div>
          </div>
          <p className="max-w-sm text-base text-white/80">
            Raih jutaan pembeli potensial, manfaatkan kampanye promosi eksklusif, dan kembangkan usaha bersama Akay Nusantara.
          </p>
        </div>
        <div className="space-y-4 text-sm text-white/90">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">1</span>
            Buat etalase profesional lengkap dengan foto dan deskripsi produk unggulanmu.
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">2</span>
            Nikmati sistem manajemen stok dan pesanan yang terintegrasi dalam satu dashboard.
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-inner">3</span>
            Dapatkan dukungan onboarding dan tips optimasi dari tim ahli Akay Nusantara.
          </div>
        </div>
        <div className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-sky-100 backdrop-blur lg:p-10">
        <div className="mb-6 space-y-2 text-sm font-medium uppercase tracking-wide text-sky-600">
          <span>Daftar seller</span>
          <span className="block h-px w-16 bg-sky-300" />
        </div>
        <h1 className="text-2xl font-semibold text-sky-900">Buat akun Akay Nusantara</h1>
        <p className="mt-2 text-sm text-sky-700/80">
          Mulai perjalanan jualanmu sebagai seller Akay Nusantara. Aktivasi toko bisa dilakukan setelah proses onboarding selesai.
        </p>

        {success ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-sm text-emerald-800 shadow-inner">
            <div className="flex items-center gap-3 text-emerald-700">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-semibold text-white">✓</span>
              <div>
                <p className="text-base font-semibold">Registrasi berhasil!</p>
                <p className="mt-1 text-sm text-emerald-700/90">
                  Silakan login menggunakan akun Anda untuk mulai berbelanja dan menyiapkan tokomu di Akay Nusantara.
                </p>
              </div>
            </div>
            <Link
              href="/seller/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600"
            >
              Lanjut ke halaman login
            </Link>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            <form method="POST" action="/api/auth/register" className="mt-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium text-sky-800">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-sky-800">
                  Email atau Nomor HP
                </label>
                <input
                  id="email"
                  type="text"
                  name="email"
                  required
                  placeholder="contoh@email.com atau 0812xxxx"
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
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-sky-800">
                  Verifikasi Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Ulangi password"
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <button
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-white"
              >
                Daftar sekarang
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
                Daftar dengan Facebook
              </button>
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 text-center font-medium text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
              >
                Daftar dengan Google
              </a>
            </div>

            <div className="mt-6 text-center text-sm text-sky-700">
              Sudah punya akun?{" "}
              <Link href="/seller/login" className="font-semibold text-sky-600 transition hover:text-sky-800">
                Log in sekarang
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
