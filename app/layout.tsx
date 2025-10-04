import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { CookieStore } from "@edge-runtime/cookies";
import { sessionOptions, SessionUser } from "@/lib/session";

export const metadata = {
  title: "Akay Nusantara",
  description: "Marketplace dengan transfer manual, COD, multi-gudang, voucher & retur",
};

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const session = await getIronSession<{ user?: SessionUser }>(
    cookieStore as unknown as CookieStore,
    sessionOptions,
  );
  return session.user ?? null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">
        <SiteHeader user={user} />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
