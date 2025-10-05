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
      <div className="border-b border-white/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center gap-4">
            <Link href="/seller/login" className="hover:underline">
              Mulai Jualan
            </Link>
            <Link href="/help" className="hover:underline">
              Bantuan
            </Link>
            <Link href="/promo" className="hover:underline">
              Promo Harian
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="hover:underline">
              Notifikasi
            </Link>
            <Link href="/support" className="hover:underline">
              Pusat Bantuan
            </Link>
            <Link href="/language" className="hover:underline">
              Bahasa Indonesia
            </Link>
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6">
        <Link href="/" className="text-2xl font-bold tracking-wide">
          🛍️ Akay Nusantara
        </Link>
        <form className="flex w-full flex-1 overflow-hidden rounded-full bg-white shadow-inner" action="/search" method="GET">
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
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/cart" className="flex items-center gap-2 hover:underline">
            <span aria-hidden>🛒</span>
            Keranjang
          </Link>
        </div>
      </div>
      <nav className="bg-[#ff8055]/70">
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
