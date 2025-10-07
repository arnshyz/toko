"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function canUseHistory() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.history.length > 1;
}

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(canUseHistory());
  }, [pathname]);

  const handleClick = useCallback(() => {
    if (canGoBack) {
      router.back();
      return;
    }
    router.push("/");
  }, [canGoBack, router]);

  const label = useMemo(() => (canGoBack ? "Kembali" : "Beranda"), [canGoBack]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 focus:outline-none focus-visible:ring"
      aria-label={`Tombol ${label}`}
    >
      <span aria-hidden className="text-lg">←</span>
      <span>{label}</span>
    </button>
  );
}
