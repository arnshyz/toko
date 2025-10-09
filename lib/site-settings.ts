import { prisma } from "@/lib/prisma";

export const SITE_SETTINGS_ID = "site";

export type SiteSettings = {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  siteName: "Akay Nusantara",
  siteDescription: "Belanja produk pilihan dari penjual terpercaya di seluruh Nusantara.",
  logoUrl: null,
};

function normalizeName(value: string | null | undefined) {
  if (!value) return DEFAULT_SITE_SETTINGS.siteName;
  const trimmed = value.trim();
  return trimmed ? trimmed : DEFAULT_SITE_SETTINGS.siteName;
}

function normalizeDescription(value: string | null | undefined) {
  if (typeof value !== "string") {
    return DEFAULT_SITE_SETTINGS.siteDescription;
  }
  const trimmed = value.trim();
  return trimmed || DEFAULT_SITE_SETTINGS.siteDescription;
}

function normalizeLogo(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const record = await prisma.siteSetting.findUnique({ where: { id: SITE_SETTINGS_ID } });
  if (!record) {
    return { ...DEFAULT_SITE_SETTINGS };
  }

  return {
    id: record.id,
    siteName: normalizeName(record.siteName),
    siteDescription: normalizeDescription(record.siteDescription),
    logoUrl: normalizeLogo(record.logoUrl),
  };
}

export type SiteSettingsInput = {
  siteName: string;
  siteDescription?: string | null;
  logoUrl?: string | null;
};

export async function saveSiteSettings(input: SiteSettingsInput): Promise<SiteSettings> {
  const siteName = normalizeName(input.siteName);
  const siteDescriptionRaw =
    typeof input.siteDescription === "string" ? input.siteDescription : undefined;
  const siteDescription = siteDescriptionRaw && siteDescriptionRaw.trim()
    ? siteDescriptionRaw.trim()
    : null;
  const logoUrl = normalizeLogo(input.logoUrl);

  const record = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {
      siteName,
      siteDescription,
      logoUrl,
    },
    create: {
      id: SITE_SETTINGS_ID,
      siteName,
      siteDescription,
      logoUrl,
    },
  });

  return {
    id: record.id,
    siteName: normalizeName(record.siteName),
    siteDescription: normalizeDescription(record.siteDescription),
    logoUrl: normalizeLogo(record.logoUrl),
  };
}
