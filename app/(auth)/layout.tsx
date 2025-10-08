import Link from "next/link";

const infoSections = [
  {
    title: "Layanan Pembeli",
    items: ["Pusat Bantuan", "Cara Belanja", "Pengembalian Dana", "Keamanan Pembeli"],
  },
  {
    title: "Jelajah Produk",
    items: ["Fashion", "Elektronik", "Kecantikan", "Ibu & Anak", "Olahraga"],
  },
  {
    title: "Pembayaran",
    items: ["Akay Pay", "Transfer Bank", "Virtual Account", "Kartu Kredit"],
  },
  {
    title: "Pengiriman",
    items: ["Akay Express", "Same Day", "Next Day", "Ekonomi"],
  },
];

const badges = ["COD", "Gratis Ongkir", "Promo Harian", "Garansi Seller", "Agen Resmi"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-200 via-sky-100 to-sky-200 text-sky-900">
      <header className="flex items-center justify-between bg-white/90 px-5 py-4 text-sm font-medium shadow-sm backdrop-blur sm:px-10">
        <Link href="/" className="flex items-center gap-3 text-base font-semibold text-sky-700 sm:text-lg">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-lg font-bold text-white shadow-lg shadow-sky-500/30">
            A
          </span>
          <span className="hidden sm:inline">Akay Nusantara</span>
        </Link>
        <Link
          href="/help"
          className="text-xs font-semibold uppercase tracking-wide text-sky-600 transition hover:text-sky-800 sm:text-sm"
        >
          Butuh bantuan?
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-6xl">{children}</div>
        </div>

        <section className="bg-sky-200/60 px-4 py-10 text-sky-800 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
            <div className="grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {infoSections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">{section.title}</h3>
                  <ul className="space-y-2 text-sky-800/90">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-sky-700">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-white/80 px-4 py-2 text-sky-600 shadow-sm shadow-sky-500/10"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white/80 px-5 py-6 text-center text-xs text-sky-600 shadow-inner sm:px-10">
        © {new Date().getFullYear()} Akay Nusantara. Semua hak cipta dilindungi.
      </footer>
    </div>
  );
}
