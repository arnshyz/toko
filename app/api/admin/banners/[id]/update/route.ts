import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

import { ensureUrl, ensureText, toNumber } from "../../utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const bannerId = Number(params.id);
  if (!Number.isInteger(bannerId)) {
    const redirectUrl = new URL("/admin/banners", req.url);
    redirectUrl.searchParams.set("error", "Banner tidak ditemukan");
    return NextResponse.redirect(redirectUrl);
  }

  const formData = await req.formData();

  let title: string;
  let description: string;
  let highlight: string;
  let imageUrl: string;
  let ctaLabel: string;
  let ctaHref: string;
  let sortOrder: number;
  const isActive = formData.get("isActive") === "on";

  try {
    title = ensureText(formData.get("title"), "Judul");
    description = ensureText(formData.get("description"), "Deskripsi");
    highlight = ensureText(formData.get("highlight"), "Highlight");
    imageUrl = ensureUrl(formData.get("imageUrl"));
    ctaLabel = ensureText(formData.get("ctaLabel"), "Label tombol");
    ctaHref = ensureUrl(formData.get("ctaHref"), { allowRelative: true });
    sortOrder = toNumber(formData.get("sortOrder"), 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Input tidak valid";
    const redirectUrl = new URL("/admin/banners", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await prisma.promoBanner.update({
      where: { id: bannerId },
      data: {
        title,
        description,
        highlight,
        imageUrl,
        ctaLabel,
        ctaHref,
        sortOrder,
        isActive,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui banner";
    const redirectUrl = new URL("/admin/banners", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/admin/banners", req.url);
  redirectUrl.searchParams.set("message", "Banner berhasil diperbarui");
  return NextResponse.redirect(redirectUrl);
}
