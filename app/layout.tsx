import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Akay Nusantara",
  description: "Marketplace dengan transfer manual, COD, multi-gudang, voucher & retur",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-army/20">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-xl font-bold text-army">🛍️ Akay Nusantara</a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/cart" className="text-army hover:underline">Keranjang</a>
              <a href="/seller/login" className="text-army hover:underline">Seller</a>
              <a href="/admin/orders" className="text-army hover:underline">Admin</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
