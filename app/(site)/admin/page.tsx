import Link from "next/link";

import { getSession } from "@/lib/session";

const adminActions = [
  {
    href: "/admin/users",
    title: "Pengguna & Seller",
    description: "Kelola akun pengguna, atur peran admin, dan pantau status seller.",
    icon: "👥",
    accent: "from-sky-500 via-cyan-500 to-emerald-400",
  },
  {
    href: "/admin/products",
    title: "Produk",
    description: "Kurasi katalog produk, kelola stok, dan moderasi listing seller.",
    icon: "🛒",
    accent: "from-fuchsia-500 via-purple-500 to-indigo-500",
  },
  {
    href: "/admin/couriers",
    title: "Kurir & Pengiriman",
    description: "Tambahkan jasa pengiriman baru atau nonaktifkan kurir yang tidak aktif.",
    icon: "🚚",
    accent: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    href: "/admin/categories",
    title: "Kategori Produk",
    description: "Bangun struktur kategori yang rapi agar pelanggan mudah menjelajah.",
    icon: "🗂️",
    accent: "from-lime-500 via-emerald-500 to-teal-500",
  },
  {
    href: "/admin/banners",
    title: "Banner & Kampanye",
    description: "Kelola banner promosi dan tampilkan kampanye penting di halaman utama.",
    icon: "📢",
    accent: "from-indigo-500 via-blue-500 to-sky-500",
  },
  {
    href: "/admin/vouchers",
    title: "Voucher",
    description: "Susun kode promo baru, tetapkan kuota, dan pantau performa voucher.",
    icon: "🎟️",
    accent: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
  {
    href: "/admin/orders",
    title: "Pesanan",
    description: "Pantau seluruh transaksi, verifikasi pembayaran, dan tindaklanjuti kendala.",
    icon: "📦",
    accent: "from-slate-500 via-gray-500 to-neutral-500",
  },
] as const;

export default async function AdminHomePage() {
  const session = await getSession();
  const currentUser = session.user;

  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-10 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Panel Admin Toko
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Satu tempat untuk mengatur seluruh operasional marketplace Anda
          </h1>
          <p className="text-sm text-white/70">
            Pilih modul administrasi di bawah untuk mulai mengelola pengguna, produk, pengiriman, promosi, dan pesanan secara terpadu.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-br ${action.accent} opacity-0 transition duration-200 group-hover:opacity-10`}
            />
            <div className="relative flex flex-col gap-6">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl transition duration-200 group-hover:scale-105">
                {action.icon}
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">{action.title}</h2>
                <p className="text-sm leading-relaxed text-gray-600">{action.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 transition duration-200 group-hover:gap-3">
                Kelola sekarang
                <span aria-hidden>→</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
