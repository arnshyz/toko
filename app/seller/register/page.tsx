import Link from "next/link";

export default function SellerRegister() {
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
                className="font-medium text-[#f53d2d] hover:text-[#d63b22]"
              >
                Butuh bantuan?
              </a>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Buat akun seller baru</h1>
            <p className="mt-2 text-sm text-gray-500">Isi data berikut untuk membuka toko dan mulai menjual produk Anda.</p>

            <form method="POST" action="/api/auth/register" className="mt-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nama Toko
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="Nama toko Anda"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/40"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
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
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/40"
                />
              </div>
              <button
                className="w-full rounded-xl bg-[#f53d2d] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#f53d2d]/30 transition hover:bg-[#e13a24] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/50"
              >
                Buat akun seller
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
                Daftar dengan Facebook
              </button>
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-medium text-gray-700 transition hover:border-[#f53d2d]/40 hover:text-[#f53d2d]"
              >
                Daftar dengan Google
              </a>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Sudah punya akun?{" "}
              <Link href="/seller/login" className="font-semibold text-[#f53d2d] hover:text-[#d63b22]">
                Log in sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
