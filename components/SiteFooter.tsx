import Link from "next/link";

const customerServiceLinks = [
  { label: "Bantuan", href: "#" },
  { label: "Metode Pembayaran", href: "#" },
  { label: "AkayPay", href: "#" },
  { label: "Koin Akay", href: "#" },
  { label: "Lacak Pesanan Pembeli", href: "#" },
  { label: "Lacak Pengiriman Penjual", href: "#" },
  { label: "Gratis Ongkir", href: "#" },
  { label: "Pengembalian Barang & Dana", href: "#" },
  { label: "Hubungi Kami", href: "#" }
];

const exploreLinks = [
  { label: "Tentang Kami", href: "#" },
  { label: "Karir", href: "#" },
  { label: "Kebijakan Privasi", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Akay Mall", href: "#" },
  { label: "Seller Center", href: "#" },
  { label: "Menjadi Mitra", href: "#" },
  { label: "Logistik Kami", href: "#" },
  { label: "Kanal Media", href: "#" }
];

const paymentProviders = [
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "Visa",
  "Mastercard",
  "Gopay",
  "Dana",
  "AkayPay",
  "Kredivo",
];

const shippingProviders = [
  "JNE",
  "J&T Express",
  "SiCepat",
  "Ninja Xpress",
  "Pos Indonesia",
  "Anteraja",
  "Wahana",
  "GrabExpress",
  "Gojek",
];

const securityBadges = ["PCI DSS", "ISO 27001", "Verisign"];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", icon: "📘" },
  { label: "Instagram", href: "https://instagram.com", icon: "📸" },
  { label: "Twitter", href: "https://twitter.com", icon: "🐦" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "💼" },
  { label: "YouTube", href: "https://youtube.com", icon: "▶️" },
];

const downloadButtons = [
  {
    label: "App Store",
    href: "https://apps.apple.com",
    image: "https://placehold.co/120x36?text=App+Store",
  },
  {
    label: "Google Play",
    href: "https://play.google.com",
    image: "https://placehold.co/120x36?text=Google+Play",
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  const bankName = process.env.BANK_NAME ?? "Bank Contoh";
  const accountName = process.env.ACCOUNT_NAME ?? "Nama Rekening";
  const bankAccount = process.env.BANK_ACCOUNT ?? "0000000000";

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white text-sm text-gray-600">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Layanan Pelanggan</h2>
            <ul className="mt-4 space-y-2">
              {customerServiceLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-indigo-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800">Jelajahi Akay Nusantara</h2>
            <ul className="mt-4 space-y-2">
              {exploreLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-indigo-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Pembayaran</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {paymentProviders.map((provider) => (
                  <span key={provider} className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-center font-medium">
                    {provider}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Pengiriman</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {shippingProviders.map((provider) => (
                  <span key={provider} className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-center font-medium">
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Ikuti Kami</h2>
              <ul className="mt-4 space-y-2">
                {socialLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="flex items-center gap-2 transition hover:text-indigo-600">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Keamanan</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {securityBadges.map((badge) => (
                  <span key={badge} className="rounded border border-gray-200 bg-gray-50 px-3 py-1 font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Download Aplikasi</h2>
            <img
              src="https://placehold.co/120x120?text=QR"
              alt="QR Code Download"
              className="h-28 w-28 rounded border border-gray-200 object-contain"
            />
            <div className="space-y-3">
              {downloadButtons.map((item) => (
                <Link key={item.label} href={item.href} className="block">
                  <img src={item.image} alt={item.label} className="w-36" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-center text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
          <div>
            Transfer ke: <strong>{bankName} - {accountName}</strong> | No. Rek: <strong>{bankAccount}</strong>
          </div>
          <div>© {year} Akay Nusantara. Semua hak dilindungi.</div>
        </div>
      </div>
    </footer>
  );
}
