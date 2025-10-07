export const DEFAULT_LOCALE = "id-ID";
export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function formatJakartaDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: JAKARTA_TIME_ZONE }).format(date);
}
