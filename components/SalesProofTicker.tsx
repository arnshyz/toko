"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SalesProofItem = {
  id: number;
  buyer: string;
  location: string;
  product: string;
  imageUrl: string;
  timeAgo: string;
};

const RAW_ITEMS: SalesProofItem[] = [
  {
    id: 1,
    buyer: "Aulia",
    location: "Jakarta",
    product: "SMM GURU 14 Hari Bergaransi",
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=60",
    timeAgo: "Baru saja",
  },
  {
    id: 2,
    buyer: "Bagus",
    location: "Bandung",
    product: "Paket Domain Premium .COM + Hosting 1 Tahun",
    imageUrl:
      "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=200&q=60",
    timeAgo: "2 menit yang lalu",
  },
  {
    id: 3,
    buyer: "Citra",
    location: "Surabaya",
    product: "Jasa Backlink Authority 50 Website",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=60",
    timeAgo: "5 menit yang lalu",
  },
  {
    id: 4,
    buyer: "Dimas",
    location: "Yogyakarta",
    product: "Optimasi SEO Marketplace Premium",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=60",
    timeAgo: "8 menit yang lalu",
  },
  {
    id: 5,
    buyer: "Eka",
    location: "Makassar",
    product: "Paket Desain Logo + Branding Kit",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=60",
    timeAgo: "10 menit yang lalu",
  },
  {
    id: 6,
    buyer: "Fajar",
    location: "Denpasar",
    product: "Bundle Sosial Media Marketing 30 Hari",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=60",
    timeAgo: "12 menit yang lalu",
  },
];

const DISPLAY_DURATION = 6500;
const FADE_DURATION = 350;

export function SalesProofTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const items = useMemo(() => {
    const shuffled = [...RAW_ITEMS];
    shuffled.sort(() => Math.random() - 0.5);
    return shuffled;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      hideTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, FADE_DURATION);
    }, DISPLAY_DURATION);

    return () => {
      clearInterval(interval);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [items.length]);

  const item = items[currentIndex];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:inset-x-auto md:bottom-6 md:left-6 md:justify-start md:px-0">
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-2xl bg-white/95 p-2.5 text-xs shadow-xl ring-1 ring-black/5 backdrop-blur transition-all duration-300 ease-out md:max-w-xs md:gap-3 md:rounded-xl md:bg-white md:p-3 md:text-sm ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <img
          src={item.imageUrl}
          alt={item.product}
          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover md:h-12 md:w-12"
        />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500 md:text-xs">
            {item.timeAgo}
          </p>
          <p className="text-[11px] leading-snug text-gray-800 md:text-sm">
            <span className="font-semibold text-indigo-600">{item.buyer}</span>{" "}
            dari {item.location} baru saja membeli
          </p>
          <p className="font-semibold text-gray-900 md:font-medium">{item.product}</p>
        </div>
      </div>
    </div>
  );
}
