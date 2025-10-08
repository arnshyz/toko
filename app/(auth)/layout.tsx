import Link from "next/link";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100 text-gray-900">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3 text-sky-700 transition hover:text-sky-900">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-xl font-bold text-white shadow-lg shadow-sky-400/30">
              A
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight">Akay Nusantara</p>
              <p className="text-xs font-medium text-sky-500">Belanja lebih hemat & cepat</p>
            </div>
          </Link>
          <a
            href="mailto:support@akay.id"
            className="text-sm font-medium text-sky-600 transition hover:text-sky-800"
          >
            Butuh bantuan?
          </a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
