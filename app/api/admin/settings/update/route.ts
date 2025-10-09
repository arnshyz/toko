import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { revalidatePath } from "next/cache";

import { saveSiteSettings } from "@/lib/site-settings";
import { sessionOptions, SessionUser } from "@/lib/session";

const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_FAVICON_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MAX_FAVICON_FILE_SIZE = 512 * 1024; // 512KB

export async function POST(req: NextRequest) {
  const session = await getIronSession<{ user?: SessionUser }>(
    req,
    new NextResponse(),
    sessionOptions,
  );
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const siteName = String(formData.get("siteName") ?? "").trim();
  const siteDescriptionRaw = formData.get("siteDescription");
  const siteDescription =
    typeof siteDescriptionRaw === "string" ? siteDescriptionRaw.trim() : "";
  const pageTitleRaw = formData.get("pageTitle");
  const pageTitle = typeof pageTitleRaw === "string" ? pageTitleRaw.trim() : "";
  const logoUrlRaw = formData.get("logoUrl");
  const logoFile = formData.get("logoFile");
  const currentLogoRaw = formData.get("currentLogo");
  const removeLogo = formData.get("removeLogo") === "1";
  const currentLogo =
    typeof currentLogoRaw === "string" && currentLogoRaw.trim() ? currentLogoRaw : null;
  const faviconUrlRaw = formData.get("faviconUrl");
  const faviconFile = formData.get("faviconFile");
  const currentFaviconRaw = formData.get("currentFavicon");
  const removeFavicon = formData.get("removeFavicon") === "1";
  const currentFavicon =
    typeof currentFaviconRaw === "string" && currentFaviconRaw.trim()
      ? currentFaviconRaw
      : null;

  if (!siteName) {
    return NextResponse.redirect(
      new URL(
        `/admin/settings?error=${encodeURIComponent("Nama website wajib diisi")}`,
        req.url,
      ),
    );
  }

  let resolvedLogoUrl: string | null = null;
  let resolvedFaviconUrl: string | null = null;

  if (!removeLogo && logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_FILE_SIZE) {
      return NextResponse.redirect(
        new URL(
          `/admin/settings?error=${encodeURIComponent("Ukuran logo maksimal 2MB")}`,
          req.url,
        ),
      );
    }

    const mimeType = logoFile.type || "image/png";
    if (!ALLOWED_LOGO_MIME_TYPES.has(mimeType)) {
      return NextResponse.redirect(
        new URL(
          `/admin/settings?error=${encodeURIComponent("Format logo tidak didukung")}`,
          req.url,
        ),
      );
    }

    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    resolvedLogoUrl = `data:${mimeType};base64,${base64}`;
  } else if (!removeLogo && typeof logoUrlRaw === "string" && logoUrlRaw.trim()) {
    resolvedLogoUrl = logoUrlRaw.trim();
  } else if (!removeLogo && currentLogo) {
    resolvedLogoUrl = currentLogo;
  } else {
    resolvedLogoUrl = null;
  }

  if (!removeFavicon && faviconFile instanceof File && faviconFile.size > 0) {
    if (faviconFile.size > MAX_FAVICON_FILE_SIZE) {
      return NextResponse.redirect(
        new URL(
          `/admin/settings?error=${encodeURIComponent("Ukuran favicon maksimal 512KB")}`,
          req.url,
        ),
      );
    }

    const mimeType = faviconFile.type || "image/png";
    if (!ALLOWED_FAVICON_MIME_TYPES.has(mimeType)) {
      return NextResponse.redirect(
        new URL(
          `/admin/settings?error=${encodeURIComponent("Format favicon tidak didukung")}`,
          req.url,
        ),
      );
    }

    const arrayBuffer = await faviconFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    resolvedFaviconUrl = `data:${mimeType};base64,${base64}`;
  } else if (!removeFavicon && typeof faviconUrlRaw === "string" && faviconUrlRaw.trim()) {
    resolvedFaviconUrl = faviconUrlRaw.trim();
  } else if (!removeFavicon && currentFavicon) {
    resolvedFaviconUrl = currentFavicon;
  } else {
    resolvedFaviconUrl = null;
  }

  try {
    await saveSiteSettings({
      siteName,
      siteDescription,
      logoUrl: resolvedLogoUrl,
      pageTitle,
      faviconUrl: resolvedFaviconUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memperbarui pengaturan website";

    return NextResponse.redirect(
      new URL(
        `/admin/settings?error=${encodeURIComponent(message)}`,
        req.url,
      ),
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin", "page");
  revalidatePath("/admin/settings", "page");

  return NextResponse.redirect(
    new URL(
      `/admin/settings?message=${encodeURIComponent("Pengaturan berhasil diperbarui")}`,
      req.url,
    ),
  );
}
