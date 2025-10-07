import { JAKARTA_TIME_ZONE } from "./time";

export interface FlashSaleLike {
  startAt: Date;
  endAt: Date;
  discountPercent: number;
}

export const FLASH_SALE_DEFAULT_TIMEZONE = JAKARTA_TIME_ZONE;
const FLASH_SALE_DEFAULT_OFFSET_MINUTES = 7 * 60;

export function parseFlashSaleDateTime(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // If the value already includes an explicit timezone we can rely on the
  // native Date parser directly.
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map((token) => Number.parseInt(token, 10));
  const timeSegments = timePart.split(":");
  const hour = Number.parseInt(timeSegments[0] ?? "", 10);
  const minute = Number.parseInt(timeSegments[1] ?? "", 10);
  const second = Number.parseInt(timeSegments[2] ?? "0", 10);

  if ([year, month, day, hour, minute, second].some((segment) => Number.isNaN(segment))) {
    return null;
  }

  const utcMillis = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(utcMillis - FLASH_SALE_DEFAULT_OFFSET_MINUTES * 60 * 1000);
}

export function isFlashSaleActive<T extends FlashSaleLike>(sale: T, now: Date = new Date()): boolean {
  return sale.startAt <= now && sale.endAt >= now;
}

export function getActiveFlashSale<T extends FlashSaleLike>(sales: T[], now: Date = new Date()): T | null {
  return (
    sales
      .filter((sale) => isFlashSaleActive(sale, now))
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] ?? null
  );
}

export function getNextFlashSale<T extends FlashSaleLike>(sales: T[], now: Date = new Date()): T | null {
  return (
    sales
      .filter((sale) => sale.startAt > now)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] ?? null
  );
}

export function calculateFlashSalePrice(basePrice: number, sale: FlashSaleLike): number {
  const discount = Math.min(Math.max(sale.discountPercent, 0), 100);
  const discounted = Math.round(basePrice * (100 - discount) / 100);
  return Math.max(0, discounted);
}

export function formatFlashSaleWindow(
  sale: FlashSaleLike,
  locale: string = "id-ID",
  timeZone: string = FLASH_SALE_DEFAULT_TIMEZONE,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });

  return `${formatter.format(sale.startAt)} - ${formatter.format(sale.endAt)}`;
}

export function toFlashSaleInputValue(date: Date): string {
  const local = new Date(date.getTime() + FLASH_SALE_DEFAULT_OFFSET_MINUTES * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
