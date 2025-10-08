"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/cart", label: "Keranjang", icon: "🛒" },
  { href: "/orders", label: "Pesanan", icon: "📦" },
  { href: "/notifications", label: "Notifikasi", icon: "🔔" },
  { href: "/account", label: "Saya", icon: "👤" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/product/")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-2px_20px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium transition ${
                isActive ? "text-sky-600" : "text-gray-500 hover:text-sky-500"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
