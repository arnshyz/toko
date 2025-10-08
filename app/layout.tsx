import "./globals.css";
import type { Metadata } from "next";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),        // penting untuk absolut URL
  title: { default: "Nama Situs", template: "%s | Nama Situs" },
  description: "Deskripsi default situs.",
  openGraph: {
    type: "website",
    siteName: "Nama Situs",
    url: abs("/"),
    images: [{ url: abs("/og/default.jpg"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [abs("/og/default.jpg")],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
