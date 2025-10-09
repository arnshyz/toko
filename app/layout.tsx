import type { Metadata } from "next";

import "./globals.css";

import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  const title = siteSettings.pageTitle || siteSettings.siteName;
  const icons: Metadata["icons"] = siteSettings.faviconUrl
    ? [
        { rel: "icon", url: siteSettings.faviconUrl },
        { rel: "icon", url: "/favicon.ico" },
      ]
    : [{ rel: "icon", url: "/favicon.ico" }];

  return {
    title,
    description: siteSettings.siteDescription,
    icons,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
