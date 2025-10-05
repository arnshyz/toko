import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

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

  try {
    await prisma.promoBanner.delete({ where: { id: bannerId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus banner";
    const redirectUrl = new URL("/admin/banners", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/admin/banners", req.url);
  redirectUrl.searchParams.set("message", "Banner berhasil dihapus");
  return NextResponse.redirect(redirectUrl);
}
