"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/lib/session";
import type { ProductCategory } from "@/lib/categories";

type SiteHeaderProps = {
  user: SessionUser | null;
  categories: ProductCategory[];
};

export function SiteHeader({ user, categories }: SiteHeaderProps) {
  const pathname = usePathname();
  const hideMobileHeader = pathname?.startsWith("/product/") ?? false;
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!categoryOpen) return;
    function handleClick(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [categoryOpen]);

  useEffect(() => {
    function computeCartCount(source?: string | null) {
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem("cart") : null;
        if (!raw) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setCartCount(0);
          return;
        }
        const total = parsed.reduce<number>((sum, item) => {
          if (!item || typeof item !== "object") return sum;
          const qty = Number((item as any).qty);
          return sum + (Number.isFinite(qty) ? qty : 0);
        }, 0);
        setCartCount(total);
      } catch (error) {
        console.error("Failed to parse cart from", source ?? "localStorage", error);
        setCartCount(0);
      }
    }

    computeCartCount("initial");

    function handleStorage(event: StorageEvent) {
      if (event.key === "cart") {
        computeCartCount("storage");
      }
    }

    function handleCartUpdated(event: Event) {
      const detail = (event as CustomEvent<{ totalQty?: number }>).detail;
      if (detail && typeof detail.totalQty === "number") {
        setCartCount(detail.totalQty);
        return;
      }
      computeCartCount("custom-event");
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart:updated", handleCartUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart:updated", handleCartUpdated as EventListener);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 text-white shadow">
      <div className="hidden border-b border-white/20 md:block">
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
                      href="/account"
                      className="block px-4 py-3 text-sm font-medium hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Akun Saya
                    </Link>
                    <Link
                      href="/orders"
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
      <div className="mx-auto hidden w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:flex">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="text-2xl font-bold tracking-wide md:text-[26px]">
            🛍️ Akay Nusantara
          </Link>
          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setCategoryOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <span aria-hidden>📂</span>
              <span>Kategori</span>
            </button>
            {categoryOpen && (
              <div className="absolute z-50 mt-2 w-64 overflow-hidden rounded-lg bg-white py-2 text-sm text-gray-700 shadow-xl">
                {categories.map((category) => (
                  <div key={category.slug} className="px-2 py-1">
                    <Link
                      href={`/categories/${category.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-gray-100"
                      onClick={() => setCategoryOpen(false)}
                    >
                      <span aria-hidden>{category.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold">{category.name}</span>
                        <span className="text-xs text-gray-500">{category.description}</span>
                      </div>
                    </Link>
                    {category.subCategories?.length ? (
                      <div className="mt-1 space-y-1 border-l border-dashed border-gray-200 pl-4">
                        {category.subCategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/categories/${sub.slug}`}
                            className="block rounded-md px-2 py-1 text-xs text-gray-600 transition hover:bg-sky-50 hover:text-sky-600"
                            onClick={() => setCategoryOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <form className="flex w-full flex-1 overflow-hidden rounded-full bg-white shadow-inner md:max-w-xl" action="/search" method="GET">
          <input
            name="q"
            type="search"
            placeholder="Cari produk unggulan, voucher, dan promo..."
            className="w-full px-3 py-2 text-sm text-gray-700 outline-none"
          />
          <button
            type="submit"
            className="bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Cari
          </button>
        </form>
        <div className="flex items-center justify-end gap-3 text-sm font-medium md:w-auto">
          <Link href="/cart" className="relative flex items-center gap-2 hover:underline">
            <span aria-hidden>🛒</span>
            Keranjang
            {cartCount > 0 ? (
              <span className="absolute -right-4 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-sky-600">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      {!hideMobileHeader ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-wide">
              🛍️ Akay Nusantara
            </Link>
            <div className="flex items-center gap-3 text-xl">
              <Link href="/notifications" aria-label="Notifikasi" className="transition hover:scale-105">
                🔔
              </Link>
              <Link href="/cart" aria-label="Keranjang" className="relative transition hover:scale-105">
                🛒
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-semibold text-sky-600">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              {user ? (
                <Link href="/account" aria-label="Akun" className="transition hover:scale-105">
                  👤
                </Link>
              ) : (
                <Link href="/seller/login" aria-label="Login" className="transition hover:scale-105">
                  🔑
                </Link>
              )}
            </div>
          </div>
          <form className="mt-3 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-gray-700 shadow-inner" action="/search" method="GET">
            <span aria-hidden className="text-lg text-sky-500">🔍</span>
            <input
              name="q"
              type="search"
              placeholder="Cari produk, toko, dan voucher"
              className="flex-1 bg-transparent outline-none"
            />
            <button type="submit" className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
              Cari
            </button>
          </form>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-[13px] font-medium">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-white/90 shadow-sm ring-1 ring-white/20"
              >
                <span aria-hidden>{category.emoji}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
