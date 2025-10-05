export function ensureUrl(value: FormDataEntryValue | null, { allowRelative = false } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("URL wajib diisi");
  }
  const trimmed = value.trim();
  if (allowRelative && trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol || !["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL harus menggunakan protokol http/https");
    }
    return trimmed;
  } catch (error) {
    if (allowRelative) {
      throw new Error("URL harus dimulai dengan / atau menggunakan protokol http/https");
    }
    const message = error instanceof Error ? error.message : "URL tidak valid";
    throw new Error(message);
  }
}

export function ensureText(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} wajib diisi`);
  }
  return value.trim();
}

export function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Urutan harus berupa angka");
  }
  return Math.trunc(parsed);
}
