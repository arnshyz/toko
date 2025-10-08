import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
