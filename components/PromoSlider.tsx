"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  title: string;
  description: string;
  highlight: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
};

export function PromoSlider({ className }: { className?: string }) {
  const slides = useMemo<Slide[]>(
    () => [
      {
        title: "Promo Spesial Minggu Ini",
        description: "Nikmati potongan harga hingga 40% untuk produk pilihan.",
        highlight: "Diskon Terbatas",
        imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
        ctaLabel: "Belanja Sekarang",
        ctaHref: "/product"
      },
      {
        title: "Gratis Ongkir ke Seluruh Indonesia",
        description: "Belanja sekarang dan dapatkan pengiriman gratis tanpa minimum belanja.",
        highlight: "Ongkir 0 Rupiah",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        ctaLabel: "Lihat Promo",
        ctaHref: "/product"
      },
      {
        title: "Flash Sale Setiap Hari",
        description: "Produk favorit dengan harga spesial hadir setiap hari jam 12.00-15.00.",
        highlight: "3 Jam Saja",
        imageUrl: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80",
        ctaLabel: "Ikuti Flash Sale",
        ctaHref: "/product"
      }
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg ${
        className ?? ""
      }`}
    >
      <div className="relative min-h-[240px]">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 flex flex-col gap-6 p-8 transition-all duration-700 ease-in-out md:flex-row md:items-center ${
              index === activeIndex
                ? "opacity-100 translate-x-0"
                : "pointer-events-none -translate-x-12 opacity-0"
            }`}
          >
            <div className="flex-1 space-y-3">
              <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-sm font-semibold uppercase tracking-wide">
                {slide.highlight}
              </span>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                {slide.title}
              </h2>
              <p className="max-w-xl text-sm md:text-base md:leading-relaxed">
                {slide.description}
              </p>
              <Link
                href={slide.ctaHref}
                className="inline-flex w-fit items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                {slide.ctaLabel}
              </Link>
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-0 rounded-xl bg-black/20" />
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="h-48 w-full rounded-xl object-cover shadow-lg md:h-64"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-8 bg-white" : "w-2 bg-white/60 hover:bg-white"
            }`}
            aria-label={`Tampilkan slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

