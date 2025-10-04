import "./globals.css";

import { getAppSession } from "@/lib/auth";

export const metadata = {
  title: "Akay Nusantara",
  description: "Marketplace dengan transfer manual, COD, multi-gudang, voucher & retur",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const user = session.user;

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-army/20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-army">🛍️ Akay Nusantara</a>
            <nav className="flex gap-4 items-center text-sm">
              <a href="/cart" className="hover:underline text-army">Keranjang</a>
              <a href="/seller/login" className="hover:underline text-army">Seller</a>
              <a href="/admin/orders" className="hover:underline text-army">Admin</a>
              {user ? (
                <>
                  <span className="text-gray-600 hidden sm:inline">Halo, {user.name.split(" ")[0]}</span>
                  <form method="POST" action="/api/auth/logout">
                    <button className="hover:underline text-army" type="submit">Logout</button>
                  </form>
                </>
              ) : (
                <>
                  <a href="/login" className="hover:underline text-army">Login</a>
                  <a href="/register" className="hover:underline text-army">Daftar</a>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t py-8 text-sm text-center text-gray-600">
          Transfer ke: <b>{process.env.BANK_NAME} - {process.env.ACCOUNT_NAME}</b> | No.Rek: <b>{process.env.BANK_ACCOUNT}</b>
          <div className="mt-2">© {new Date().getFullYear()} Akay Nusantara</div>
        </footer>
      </body>
    </html>
  );
}
