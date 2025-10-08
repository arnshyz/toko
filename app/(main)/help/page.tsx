import Link from "next/link";

const helpCategories = [
  {
    title: "Akun & Keamanan",
    description: "Panduan login, verifikasi, dan keamanan akun pembeli maupun penjual.",
    icon: "🔐",
    links: [
      { href: "/help/articles/akun-baru", label: "Cara membuat akun baru" },
      { href: "/help/articles/reset-password", label: "Reset kata sandi" },
      { href: "/help/articles/verifikasi-email", label: "Verifikasi email & nomor HP" },
    ],
  },
  {
    title: "Belanja & Pembayaran",
    description: "Langkah berbelanja, metode pembayaran, hingga tips transaksi aman.",
    icon: "🛍️",
    links: [
      { href: "/help/articles/cara-belanja", label: "Cara belanja di Akay" },
      { href: "/help/articles/pembayaran-transfer", label: "Panduan pembayaran transfer manual" },
      { href: "/help/articles/pembayaran-cod", label: "Ketentuan bayar di tempat (COD)" },
    ],
  },
  {
    title: "Pengiriman & Pesanan",
    description: "Informasi pengiriman, pelacakan, serta perubahan status pesanan.",
    icon: "🚚",
    links: [
      { href: "/help/articles/lacak-pesanan", label: "Melacak pesanan Anda" },
      { href: "/help/articles/ongkir", label: "Perhitungan ongkir & estimasi" },
      { href: "/help/articles/pesanan-ditolak", label: "Pesanan ditolak penjual" },
    ],
  },
  {
    title: "Penjual & Toko",
    description: "Optimasi katalog, manajemen pesanan, dan kebijakan retur untuk seller.",
    icon: "🏪",
    links: [
      { href: "/help/articles/mulai-jualan", label: "Cara mulai jualan" },
      { href: "/help/articles/kelola-pesanan", label: "Mengelola pesanan" },
      { href: "/help/articles/kebijakan-retur", label: "Kebijakan retur & pembatalan" },
    ],
  },
];

const quickLinks = [
  { href: "/help/articles/pembayaran-belum-bayar", label: "Pesanan belum bayar" },
  { href: "/help/articles/pesanan-diproses", label: "Pesanan sedang diproses" },
  { href: "/help/articles/pesanan-dibatalkan", label: "Pesanan dibatalkan" },
  { href: "/help/articles/voucher", label: "Voucher & promo" },
];

export const metadata = {
  title: "Bantuan | Akay Nusantara",
  description: "Pusat bantuan resmi Akay Nusantara: FAQ, panduan seller, dan dukungan pelanggan.",
};

export default function HelpPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 px-6 py-12 text-white shadow-xl">
        <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Pusat Bantuan Akay Nusantara
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">Halo! Ada yang bisa kami bantu?</h1>
            <p className="max-w-2xl text-sm text-indigo-100">
              Temukan solusi cepat untuk berbagai pertanyaan seputar transaksi, pengiriman, hingga pengelolaan toko. Tim kami siap membantu 24/7.
            </p>
            <form className="flex flex-col gap-2 md:flex-row" role="search" action="/search" method="GET">
              <label className="sr-only" htmlFor="help-search">
                Cari di pusat bantuan
              </label>
              <input
                id="help-search"
                name="q"
                type="search"
                placeholder="Cari artikel bantuan..."
                className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow hover:bg-indigo-50"
              >
                Cari Artikel
              </button>
            </form>
            <div className="flex flex-wrap gap-2 text-xs text-indigo-100">
              <span>Topik populer:</span>
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:block text-7xl" aria-hidden>
            💡
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-gray-900">Kategori Bantuan</h2>
          <p className="text-sm text-gray-600">Pilih kategori untuk melihat panduan lengkap.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {helpCategories.map((category) => (
            <article key={category.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <header className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  {category.icon}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </header>
              <ul className="mt-4 space-y-2 text-sm">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2 hover:border-indigo-200 hover:text-indigo-600">
                      <span>{link.label}</span>
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-xs text-gray-500">
                <Link href="/support" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Butuh bantuan lanjutan?
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.1fr,0.9fr] md:items-center">
        <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-6 shadow-inner">
          <h2 className="text-lg font-semibold text-sky-900">Hubungi Kami</h2>
          <p className="mt-2 text-sm text-sky-700">
            Tim dukungan siap membantu Anda melalui berbagai kanal resmi. Silakan pilih metode yang paling nyaman.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-sky-800">
            <li>📧 Email: <a href="mailto:support@akay.id" className="font-semibold">support@akay.id</a></li>
            <li>💬 Live chat melalui aplikasi Akay Nusantara</li>
            <li>📞 Hotline operasional 08.00 - 22.00 WIB</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Pertanyaan Populer</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li>
              <Link href="/help/articles/pembayaran-otomatis" className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2 hover:border-indigo-200 hover:text-indigo-600">
                <span>Bagaimana cara mengunggah bukti pembayaran?</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link href="/help/articles/retur" className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2 hover:border-indigo-200 hover:text-indigo-600">
                <span>Langkah mengajukan retur barang?</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link href="/help/articles/akun-diblokir" className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2 hover:border-indigo-200 hover:text-indigo-600">
                <span>Apa yang harus dilakukan saat akun diblokir?</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
