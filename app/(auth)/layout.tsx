import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sky-100 text-sky-900">
      <header className="flex items-center justify-between px-6 py-5 text-sm font-medium md:px-12">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-sky-800 md:text-lg">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-sky-500 shadow-md">A</span>
          <span className="hidden sm:inline">Akay Nusantara</span>
        </Link>
        <Link
          href="/help"
          className="text-xs font-semibold uppercase tracking-wide text-sky-700 transition hover:text-sky-900 md:text-sm"
        >
          Butuh bantuan?
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-6xl">{children}</div>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-sky-700/70 md:px-12">
        © {new Date().getFullYear()} Akay Nusantara. Semua hak cipta dilindungi.
      </footer>
    </div>
  );
}
