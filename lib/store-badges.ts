export type StoreBadgeStyle = {
  label: string;
  className: string;
  imageSrc?: string;
  imageClassName?: string;
};

export const STORE_BADGE_STYLES: Record<string, StoreBadgeStyle> = {
  BASIC: { label: "Basic", className: "bg-gray-100 text-gray-700" },
  STAR: { label: "Star", className: "bg-amber-100 text-amber-700" },
  STAR_PLUS: { label: "Star+", className: "bg-orange-100 text-orange-700" },
  MALL: {
    label: "MALL",
    className: "bg-transparent p-0",
    imageSrc:
      "https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/productdetailspage/b1a5d6e20b0093b1b8f0.svg",
    imageClassName: "h-4 w-auto",
  },
  PREMIUM: { label: "Premium", className: "bg-indigo-100 text-indigo-600" },
};

export function resolveStoreBadgeStyle(badge?: string | null) {
  if (!badge) {
    return STORE_BADGE_STYLES.BASIC;
  }
  return STORE_BADGE_STYLES[badge] ?? STORE_BADGE_STYLES.BASIC;
}

export function shouldDisplayStoreBadge(badge?: string | null) {
  if (!badge) return false;
  return badge !== "BASIC";
}
