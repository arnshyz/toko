import Link from "next/link";

import { formatIDR } from "@/lib/utils";
import { resolveStoreBadgeStyle, shouldDisplayStoreBadge } from "@/lib/store-badges";

function formatSoldCount(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatRating(value: number) {
  if (!Number.isFinite(value)) return "0.0";
  return value.toFixed(1);
}

export type ProductCardProps = {
  href: string;
  title: string;
  imageUrl: string | null;
  salePrice: number;
  basePrice?: number | null;
  originalPrice?: number | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  soldCount?: number | null;
  storeBadge?: string | null;
  discountPercent?: number | null;
  className?: string;
};

export function ProductCard({
  href,
  title,
  imageUrl,
  salePrice,
  basePrice,
  originalPrice,
  ratingAverage,
  ratingCount,
  soldCount,
  storeBadge,
  discountPercent,
  className,
}: ProductCardProps) {
  const classes = [
    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
  ];
  if (className) {
    classes.push(className);
  }

  const referenceCandidates = [originalPrice, basePrice].filter((value): value is number => typeof value === "number");
  const referencePrice = referenceCandidates.reduce((acc, value) => (value > acc ? value : acc), 0);
  const comparePrice = referencePrice > salePrice ? referencePrice : null;
  const derivedDiscountPercent = (() => {
    if (typeof discountPercent === "number" && discountPercent > 0) {
      return Math.round(discountPercent);
    }
    if (comparePrice) {
      const percent = Math.round(((comparePrice - salePrice) / comparePrice) * 100);
      return percent > 0 ? percent : null;
    }
    return null;
  })();

  const badge = resolveStoreBadgeStyle(storeBadge);
  const showBadge = shouldDisplayStoreBadge(storeBadge) || Boolean(badge.imageSrc);

  return (
    <article className={classes.join(" ")}>
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">🛍️</div>
          )}
          {derivedDiscountPercent ? (
            <span className="absolute right-3 top-3 rounded-md bg-[#f53d2d] px-2 py-1 text-xs font-semibold text-white shadow">
              -{derivedDiscountPercent}%
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <div className="flex items-start gap-2">
          {showBadge ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-sm text-[10px] font-semibold uppercase tracking-wide ${
                badge.imageSrc ? "" : "px-2 py-0.5"
              } ${badge.className}`}
            >
              {badge.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.imageSrc} alt={badge.label} className={badge.imageClassName ?? "h-4 w-auto"} />
              ) : (
                badge.label
              )}
            </span>
          ) : null}
          <Link
            href={href}
            className="flex-1 text-sm font-semibold text-gray-900 line-clamp-2 transition-colors duration-200 group-hover:text-[#f53d2d]"
          >
            {title}
          </Link>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="text-lg font-bold text-[#f53d2d]">Rp {formatIDR(salePrice)}</div>
          {typeof soldCount === "number" ? (
            <div className="text-[11px] font-medium text-gray-500">{formatSoldCount(soldCount)} Terjual</div>
          ) : null}
        </div>
        {comparePrice ? (
          <div className="text-xs text-gray-400 line-through">Rp {formatIDR(comparePrice)}</div>
        ) : null}
        {typeof ratingAverage === "number" ? (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="text-[#f59e0b]">★</span>
            <span className="font-semibold text-gray-700">{formatRating(ratingAverage)}</span>
            {typeof ratingCount === "number" && ratingCount > 0 ? (
              <span className="text-gray-400">({new Intl.NumberFormat("id-ID").format(ratingCount)})</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
