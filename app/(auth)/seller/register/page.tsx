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
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 text-sky-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-600">
          AKAY NUSANTARA
        </span>
        <h1 className="text-2xl font-semibold text-sky-900">Buat akun seller</h1>
        <p className="max-w-sm text-sm text-sky-700/80">
          Daftar cepat dan mulai perkenalkan produkmu kepada jutaan pembeli di Akay Nusantara.
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 p-6 backdrop-blur-sm">
        {success ? (
          <div className="space-y-4 text-sm text-sky-800">
            <p className="rounded-2xl bg-emerald-100/70 px-4 py-3 text-base font-semibold text-emerald-700">
              Registrasi berhasil! Silakan login untuk melanjutkan pengaturan tokomu.
            </p>
            <Link
              href="/seller/login"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-sky-100"
            >
              Lanjut ke halaman login
            </Link>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="mb-5 rounded-2xl bg-red-100/70 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}
            <form method="POST" action="/api/auth/register" className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-sky-800">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-2xl bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-sky-800">
                  Email atau Nomor HP
                </label>
                <input
                  id="email"
                  type="text"
                  name="email"
                  required
                  placeholder="contoh@email.com atau 0812xxxx"
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
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-2xl bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-sky-800">
                  Verifikasi Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Ulangi password"
                  className="w-full rounded-2xl bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                />
              </div>
              <button
                className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-sky-100"
              >
                Daftar sekarang
              </button>
            </form>

            <div className="mt-6 space-y-3 text-sm">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/70 px-4 py-3 font-medium text-sky-700 transition hover:bg-white/90"
              >
                Daftar dengan Facebook
              </button>
              <a
                href="/api/auth/google"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-center font-medium text-sky-700 transition hover:bg-white/90"
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
