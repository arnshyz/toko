import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import { getSession, SessionUser } from "@/lib/session";

export const metadata = {
  title: "Akay Nusantara",
  description: "Marketplace dengan transfer manual, COD, multi-gudang, voucher & retur",
};

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">
        <SiteHeader user={user} />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
