import Link from "next/link";

export const metadata = {
  title: "Notifikasi | Akay Nusantara",
  description: "Pantau promo khusus, pembaruan toko, dan status pesanan Anda di satu tempat.",
};

const buyerNotifications = [
  {
    title: "Promo Eksklusif Pembeli",
    description: "Diskon khusus dan voucher yang hanya tersedia dalam waktu terbatas.",
    icon: "🎁",
    action: { href: "/product?sort=best", label: "Lihat Produk Rekomendasi" },
  },
  {
    title: "Update Kebijakan Toko",
    description: "Perubahan terbaru terkait layanan, pengiriman, dan keamanan akun.",
    icon: "📜",
    action: { href: "/help", label: "Baca Detail Kebijakan" },
  },
  {
    title: "Status Pesanan",
    description: "Notifikasi real-time ketika pesanan diproses, dikirim, atau selesai.",
    icon: "🚚",
    action: { href: "/orders", label: "Lacak Pesanan" },
  },
  {
    title: "Pembayaran Belum Selesai",
    description: "Pengingat pesanan yang belum dibayar lengkap dengan instruksi pembayaran.",
    icon: "💳",
    action: { href: "/checkout", label: "Selesaikan Pembayaran" },
  },
];

const sellerNotifications = [
  {
    title: "Pesanan Baru",
    description: "Dapatkan informasi ketika ada pesanan baru yang masuk ke toko Anda.",
    icon: "🛒",
    action: { href: "/seller/orders", label: "Kelola Pesanan" },
  },
  {
    title: "Pembatalan & Retur",
    description: "Notifikasi khusus jika pembeli mengajukan pembatalan atau permintaan retur.",
    icon: "↩️",
    action: { href: "/seller/orders?tab=returns", label: "Pantau Retur" },
  },
  {
    title: "Penilaian Pembeli",
    description: "Pemberitahuan segera ketika produk Anda menerima ulasan baru.",
    icon: "⭐",
    action: { href: "/seller/reviews", label: "Lihat Ulasan" },
  },
  {
    title: "Promo & Event Seller",
    description: "Info eksklusif mengenai promo penjual dan kampanye marketing terbaru.",
    icon: "📣",
    action: { href: "/seller/promo", label: "Ikuti Promo" },
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-400 px-6 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Pusat Notifikasi
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">Semua Informasi dalam Satu Halaman</h1>
            <p className="max-w-2xl text-sm text-sky-50/90">
              Dapatkan update promo spesial, kebijakan terbaru, status pesanan, hingga notifikasi penilaian pelanggan tanpa ketinggalan.
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link href="/product" className="rounded-full bg-white/20 px-4 py-2 text-white hover:bg-white/30">
                Jelajahi Produk
              </Link>
              <Link href="/help" className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20">
                Pusat Bantuan
              </Link>
            </div>
          </div>
          <div className="hidden text-7xl md:block" aria-hidden>
            🔔
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Untuk Pembeli</h2>
              <p className="text-sm text-gray-500">Pantau segala hal terkait promo dan pesanan Anda.</p>
            </div>
            <span className="text-3xl" aria-hidden>
              🛍️
            </span>
          </header>
          <div className="space-y-4">
            {buyerNotifications.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    <Link href={item.action.href} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                      {item.action.label}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Untuk Penjual</h2>
              <p className="text-sm text-gray-500">Notifikasi penting untuk menjaga performa toko Anda.</p>
            </div>
            <span className="text-3xl" aria-hidden>
              🏪
            </span>
          </header>
          <div className="space-y-4">
            {sellerNotifications.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    <Link href={item.action.href} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                      {item.action.label}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-inner">
        <div className="grid gap-4 md:grid-cols-[1.25fr,1fr] md:items-center">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-indigo-900">Kelola Preferensi Notifikasi</h2>
            <p className="text-sm text-indigo-700">
              Personalisasi notifikasi yang ingin Anda terima melalui email dan aplikasi. Pastikan Anda tidak melewatkan info penting.
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link href="/account" className="rounded-full bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
                Pengaturan Akun
              </Link>
              <Link href="/support" className="rounded-full border border-indigo-300 px-4 py-2 text-indigo-700 hover:border-indigo-400 hover:text-indigo-800">
                Hubungi Dukungan
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4 text-sm text-indigo-700 shadow-sm">
            <p className="font-semibold">Highlight Hari Ini</p>
            <ul className="mt-2 space-y-2">
              <li>🔥 Flash Sale mulai pukul 12.00 WIB</li>
              <li>📬 Email pembayaran otomatis siap dikirim</li>
              <li>⭐ Jangan lupa balas ulasan terbaru dari pelanggan</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
