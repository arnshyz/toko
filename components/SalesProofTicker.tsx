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
    <div className="pointer-events-none fixed bottom-6 left-6 z-50">
      <div
        className={`pointer-events-auto flex max-w-xs items-center gap-3 rounded-xl bg-white p-3 shadow-xl ring-1 ring-black/5 transition duration-300 ease-out ${
          isVisible ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
        }`}
      >
        <img
          src={item.imageUrl}
          alt={item.product}
          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
        />
        <div className="space-y-0.5 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
            {item.timeAgo}
          </p>
          <p className="text-gray-800">
            <span className="font-semibold text-indigo-600">{item.buyer}</span>{" "}
            dari {item.location} baru saja membeli
          </p>
          <p className="font-medium text-gray-900">{item.product}</p>
        </div>
      </div>
    </div>
  );
}
