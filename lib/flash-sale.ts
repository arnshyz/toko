export interface FlashSaleLike {
  startAt: Date;
  endAt: Date;
  discountPercent: number;
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

export function formatFlashSaleWindow(sale: FlashSaleLike, locale: string = "id-ID"): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(sale.startAt)} - ${formatter.format(sale.endAt)}`;
}
