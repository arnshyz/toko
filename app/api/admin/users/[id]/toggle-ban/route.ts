import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (params.id === actor.id) {
    const redirectUrl = new URL("/admin/users", req.url);
    redirectUrl.searchParams.set(
      "error",
      "Tidak dapat mengubah status ban pada akun sendiri",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    const redirectUrl = new URL("/admin/users", req.url);
    redirectUrl.searchParams.set("error", "Pengguna tidak ditemukan");
    return NextResponse.redirect(redirectUrl);
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { isBanned: !target.isBanned },
  });

  const redirectUrl = new URL("/admin/users", req.url);
  redirectUrl.searchParams.set(
    "message",
    target.isBanned ? "Pengguna berhasil dipulihkan" : "Pengguna berhasil diblokir",
  );
  return NextResponse.redirect(redirectUrl);
}
