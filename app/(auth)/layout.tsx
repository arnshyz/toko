import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 via-sky-200 to-sky-100 text-sky-900">
        <header className="flex items-center justify-between bg-white/80 px-5 py-4 text-sm font-medium backdrop-blur-md sm:px-10">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold text-sky-700 sm:text-lg">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-base font-bold uppercase tracking-[0.3em] text-white shadow-md shadow-sky-500/30">
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
          <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
            <div className="w-full max-w-xl">{children}</div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
