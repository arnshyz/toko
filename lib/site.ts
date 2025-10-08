export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://akay.web.id";
export const abs = (p = "") => new URL(p, SITE_URL).toString();
