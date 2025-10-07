"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type PromoSlide = {
  title: string;
  description: string;
  highlight: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
};

export function PromoSlider({
  className,
  slides,
}: {
  className?: string;
  slides: PromoSlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 ${
          className ?? ""
        }`}
      >
        Belum ada banner promo yang aktif.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg ${
        className ?? ""
      }`}
    >
      <div className="relative min-h-[200px] md:min-h-[260px]">
        {slides.map((slide, index) => (
          <div
            key={`${slide.title}-${index}`}
            className={`absolute inset-0 flex flex-col-reverse gap-4 p-5 transition-all duration-700 ease-in-out sm:gap-6 sm:p-6 md:flex-row md:flex-row-reverse md:items-center md:gap-8 md:p-8 ${
              index === activeIndex
                ? "opacity-100 translate-x-0"
                : "pointer-events-none -translate-x-12 opacity-0"
            }`}
          >
            <div className="flex-1 space-y-3 text-center md:text-left">
              <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide md:px-4 md:text-sm">
                {slide.highlight}
              </span>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                {slide.title}
              </h2>
              <p className="mx-auto max-w-xl text-sm text-white/90 sm:text-base md:mx-0 md:leading-relaxed">
                {slide.description}
              </p>
              <Link
                href={slide.ctaHref}
                className="inline-flex w-fit items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 md:px-5"
              >
                {slide.ctaLabel}
              </Link>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-xl shadow-lg">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="h-44 w-full object-cover sm:h-52 md:h-64"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-${index}`}
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

