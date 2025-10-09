"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type ImageSource = {
  id: string;
  src: string;
};

type GalleryImage = ImageSource & {
  alt: string;
};

type ProductImageGalleryProps = {
  title: string | null;
  images: ImageSource[];
  fallbackImage?: string | null;
  heroPlaceholder: string;
  thumbPlaceholder: string;
  topOverlay?: ReactNode;
};

export function ProductImageGallery({
  title,
  images,
  fallbackImage,
  heroPlaceholder,
  thumbPlaceholder,
  topOverlay,
}: ProductImageGalleryProps) {
  const normalizedImages = useMemo<GalleryImage[]>(() => {
    const fallbackSrc = fallbackImage ?? heroPlaceholder;
    const filtered = images.filter((image) => Boolean(image?.src));

    if (filtered.length === 0) {
      return [
        {
          id: "fallback",
          src: fallbackSrc,
          alt: `Gambar ${title ?? "Produk"}`,
        },
      ];
    }

    return filtered.map((image, index) => ({
      ...image,
      alt: `Gambar ${index + 1} dari ${title ?? "Produk"}`,
    }));
  }, [fallbackImage, heroPlaceholder, images, title]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleImages = normalizedImages.length > 1;
  const safeIndex = Math.min(currentIndex, normalizedImages.length - 1);
  const currentImage = normalizedImages[safeIndex]!;
  const thumbnailImages = normalizedImages.slice(0, 5);

  const showPreviousImage = () => {
    if (!hasMultipleImages) return;

    setCurrentIndex((prev) => {
      const nextIndex = prev - 1;
      if (nextIndex < 0) {
        return normalizedImages.length - 1;
      }
      return nextIndex;
    });
  };

  const showNextImage = () => {
    if (!hasMultipleImages) return;

    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= normalizedImages.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="lg:p-4">
          <img
            key={currentImage.id}
            src={currentImage.src}
            alt={currentImage.alt}
            className="aspect-[3/4] w-full object-cover transition-opacity duration-200 lg:aspect-[4/3] lg:rounded-xl"
          />
        </div>

        {topOverlay}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              aria-label="Lihat gambar sebelumnya"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              aria-label="Lihat gambar berikutnya"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible xl:grid-cols-5">
        {thumbnailImages.map((image, index) => {
          const isActive = image.id === currentImage.id;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`flex h-20 min-w-[80px] items-center justify-center overflow-hidden rounded-lg border bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                isActive
                  ? "border-sky-500 ring-2 ring-sky-200"
                  : "border-dashed border-gray-200"
              }`}
              aria-label={`Pilih gambar ${index + 1}`}
              aria-pressed={isActive}
            >
              <img
                src={image.src || thumbPlaceholder}
                alt={image.alt}
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

type IconProps = {
  className?: string;
};

function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
