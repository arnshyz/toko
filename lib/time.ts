export const DEFAULT_LOCALE = "id-ID";
export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function formatJakartaDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: JAKARTA_TIME_ZONE }).format(date);
}

export function formatRelativeTimeFromNow(
  dateInput: Date | string | number | null | undefined,
  locale: string = DEFAULT_LOCALE,
  now: Date = new Date(),
): string | null {
  if (!dateInput) {
    return null;
  }

  const candidate =
    typeof dateInput === "number" || typeof dateInput === "string"
      ? new Date(dateInput)
      : dateInput;

  if (!(candidate instanceof Date) || Number.isNaN(candidate.getTime())) {
    return null;
  }

  const diff = now.getTime() - candidate.getTime();
  const absDiff = Math.abs(diff);

  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  if (absDiff < 30_000) {
    return diff >= 0 ? "baru saja" : "sebentar lagi";
  }

  if (absDiff < MINUTE) {
    return diff >= 0 ? "kurang dari satu menit lalu" : "kurang dari satu menit lagi";
  }

  if (absDiff < HOUR) {
    const minutes = Math.max(1, Math.round(absDiff / MINUTE));
    const suffix = diff >= 0 ? "lalu" : "lagi";
    return `sekitar ${minutes} menit ${suffix}`;
  }

  if (absDiff < DAY) {
    const hours = Math.max(1, Math.round(absDiff / HOUR));
    const suffix = diff >= 0 ? "lalu" : "lagi";
    return `sekitar ${hours} jam ${suffix}`;
  }

  if (absDiff < 7 * DAY) {
    const days = Math.max(1, Math.round(absDiff / DAY));
    const suffix = diff >= 0 ? "lalu" : "lagi";
    return `sekitar ${days} hari ${suffix}`;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(candidate);
}
