"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { SessionUser } from "@/lib/session";
import { productCategories } from "@/lib/categories";

type SiteHeaderProps = {
  user: SessionUser | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <header className="bg-gradient-to-r from-[#f53d2d] via-[#f63] to-[#ff6f3c] text-white shadow">
      <div className="flex items-center justify-between px-4 py-2 md:hidden">
        <Link href="/" className="text-base font-semibold tracking-wide">
          🛍️ Akay Nusantara
        </Link>
        <button
          type="button"
          className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          onClick={() => setMobileCollapsed((prev) => !prev)}
          aria-expanded={!mobileCollapsed}
        >
          {mobileCollapsed ? "Tampilkan" : "Hide"}
        </button>
      </div>
      <div className={`${mobileCollapsed ? "hidden md:block" : "block"} border-b border-white/20`}>
        <div className="mx-auto max-w-6xl px-4 py-2 text-[11px] sm:text-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
              <Link href="/seller/login" className="hover:underline">
                Mulai Jualan
              </Link>
              <span className="hidden h-1 w-px bg-white/40 sm:block" aria-hidden />
              <Link href="/help" className="hover:underline">
                Bantuan
              </Link>
              <span className="hidden h-1 w-px bg-white/40 sm:block" aria-hidden />
              <Link href="/promo" className="hover:underline">
                Promo Harian
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
              <Link href="/notifications" className="hover:underline">
                Notifikasi
              </Link>
              <span className="hidden h-1 w-px bg-white/40 sm:block" aria-hidden />
              <Link href="/support" className="hover:underline">
                Pusat Bantuan
              </Link>
              <span className="hidden h-1 w-px bg-white/40 sm:block" aria-hidden />
              <Link href="/language" className="hover:underline">
                Bahasa Indonesia
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 sm:justify-end">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold uppercase">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                    <span className="hidden sm:block line-clamp-1 max-w-[120px] text-left">{user.name}</span>
                  </button>
                  {open && (
                    <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-md bg-white text-gray-700 shadow-lg">
                      <Link
                        href="/seller/dashboard"
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Akun Saya
                      </Link>
                      <Link
                        href="/seller/orders"
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        Pesanan Saya
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setOpen(false);
                          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                          window.location.href = "/";
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/seller/register" className="hover:underline">
                    Daftar
                  </Link>
                  <span className="opacity-70">|</span>
                  <Link href="/seller/login" className="hover:underline">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${mobileCollapsed ? "hidden md:flex" : "flex"} mx-auto max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6`}
      >
        <Link
          href="/"
          className="hidden text-center text-2xl font-bold tracking-wide md:block md:text-left"
        >
          🛍️ Akay Nusantara
        </Link>
        <form
          className="order-3 flex w-full flex-1 overflow-hidden rounded-full bg-white/95 shadow-inner backdrop-blur md:order-2"
          action="/search"
          method="GET"
        >
          <input
            name="q"
            type="search"
            placeholder="Cari produk unggulan, voucher, dan promo..."
            className="w-full px-4 py-2 text-sm text-gray-700 outline-none"
          />
          <button
            type="submit"
            className="bg-[#f53d2d] px-5 text-sm font-semibold text-white transition hover:bg-[#d73224]"
          >
            Cari
          </button>
        </form>
        <div className="flex w-full items-center justify-center gap-4 text-sm font-medium md:w-auto md:justify-end">
          <Link href="/cart" className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 transition hover:bg-white/25">
            <span aria-hidden>🛒</span>
            Keranjang
          </Link>
        </div>
      </div>
      <nav className={`${mobileCollapsed ? "hidden md:block" : "block"} bg-[#ff8055]/70`}>
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 overflow-x-auto px-4 py-2 text-xs font-medium">
          {productCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/#kategori-${category.slug}`}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 transition hover:bg-white/20"
            >
              <span aria-hidden>{category.emoji}</span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
