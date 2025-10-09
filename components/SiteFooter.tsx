import Link from "next/link";

import type { SiteSettings } from "@/lib/site-settings";

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
  {
    label: "BCA",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/960px-Bank_Central_Asia.svg.png",
  },
  {
    label: "Mandiri",
    image:
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Bank_Mandiri_logo.svg/222px-Bank_Mandiri_logo.svg.png",
  },
  {
    label: "BRI",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/126px-BANK_BRI_logo.svg.png",
  },
  {
    label: "BNI",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Logo_Wondr_by_BNI.svg/600px-Logo_Wondr_by_BNI.svg.png",
  },
  {
    label: "Visa",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/960px-Visa_Inc._logo.svg.png",
  },
  {
    label: "Mastercard",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/960px-Mastercard-logo.svg.png",
  },
  {
    label: "Gopay",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/63px-Gopay_logo.svg.png?20251006142655",
  },
  {
    label: "Dana",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/768px-Logo_dana_blue.svg.png",
  },
  {
    label: "AkayPay",
    image: "https://i.ibb.co.com/VYr4cq1L/Chat-GPT-Image-8-Okt-2025-02-33-44.png",
  },
  {
    label: "Kredivo",
    image: "https://i.ibb.co.com/VYr4cq1L/Chat-GPT-Image-8-Okt-2025-02-33-44.png",
  },
  {
    label: "QRIS",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/QRIS_logo.svg/384px-QRIS_logo.svg.png",
  },
];

const shippingProviders = [
  {
    label: "JNE",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/New_Logo_JNE.png/250px-New_Logo_JNE.png",
  },
  {
    label: "J&T Express",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/J%26T_Express_logo.svg/648px-J%26T_Express_logo.svg.png",
  },
  {
    label: "SiCepat",
    image: "https://www.nuwori.com/wp-content/uploads/2017/10/logo-sicepat.png",
  },
  {
    label: "Ninja Xpress",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ninjavan.svg/1200px-Ninjavan.svg.png",
  },
  {
    label: "Pos Indonesia",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/POSIND_2023_%28with_wordmark%29.svg/1200px-POSIND_2023_%28with_wordmark%29.svg.png",
  },
  {
    label: "Anteraja",
    image:
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgptDhruUEVvL-uVI1kQOYuANx7pM50JEqvTJCdOO7Pb5ByZQXxk36jsgVo9N8TrLB8stiEDhFEJupO0jZGIFlsneJOm5fBZJee3SDr_rl_Hd8r-6KT9qaOPi1vJC9bFqzuObQypK6kkpf_/s1254/logo-anteraja.png",
  },
  {
    label: "Wahana",
    image:
      "https://iconlogovector.com/uploads/images/2023/11/lg-655c004b3b012-wahana-express.png",
  },
  {
    label: "GrabExpress",
    image: "https://my.hdistore.com/img/grabexpress.png",
  },
  {
    label: "Gojek",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gojek_logo_2022.svg/1280px-Gojek_logo_2022.svg.png",
  },
];

const securityBadges = [
  {
    label: "PCI DSS",
    image: "https://nationalprocessing.com/wp-content/uploads/2021/07/2032868.png",
  },
  {
    label: "ISO 27001",
    image: "https://vectorez.biz.id/wp-content/uploads/2023/12/Logo-ISO-27001.png",
  },
  {
    label: "Verisign",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/VeriSign.svg",
  },
];

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
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png",
  },
  {
    label: "Google Play",
    href: "https://play.google.com",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1200px-Google_Play_Store_badge_EN.svg.png",
  },
];

type SiteFooterProps = {
  siteSettings: SiteSettings;
};

export function SiteFooter({ siteSettings }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const bankName = process.env.BANK_NAME ?? "Bank Contoh";
  const accountName = process.env.ACCOUNT_NAME ?? "Nama Rekening";
  const bankAccount = process.env.BANK_ACCOUNT ?? "0000000000";
  const displayName = siteSettings.siteName;
  const description = siteSettings.siteDescription;
  const logoUrl = siteSettings.logoUrl;

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white text-sm text-gray-600">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 grid gap-4 text-center md:grid-cols-[auto_1fr] md:items-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            {logoUrl ? (
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                <img src={logoUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
              </span>
            ) : (
              <span aria-hidden className="text-3xl">🛍️</span>
            )}
            <div className="text-left">
              <h2 className="text-xl font-semibold text-gray-800">{displayName}</h2>
              <p className="text-xs text-gray-500">Platform marketplace terpercaya</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 md:max-w-2xl">{description}</p>
        </div>
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
              <div className="mt-4 grid grid-cols-3 gap-3">
                {paymentProviders.map((provider) => (
                  <div
                    key={provider.label}
                    className="flex items-center justify-center rounded border border-gray-200 bg-white p-2"
                  >
                    <img
                      src={provider.image}
                      alt={provider.label}
                      className="h-8 w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Pengiriman</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {shippingProviders.map((provider) => (
                  <div
                    key={provider.label}
                    className="flex items-center justify-center rounded border border-gray-200 bg-white p-2"
                  >
                    <img
                      src={provider.image}
                      alt={provider.label}
                      className="h-8 w-full object-contain"
                      loading="lazy"
                    />
                  </div>
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
              <div className="mt-4 flex flex-wrap gap-3">
                {securityBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center justify-center rounded border border-gray-200 bg-white p-2"
                  >
                    <img
                      src={badge.image}
                      alt={badge.label}
                      className="h-8 w-24 object-contain"
                      loading="lazy"
                    />
                  </div>
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
          <div>© {year} {displayName}. Semua hak dilindungi.</div>
        </div>
      </div>
    </footer>
  );
}
