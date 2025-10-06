import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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

  try {
    await prisma.voucher.delete({ where: { id: params.id } });
    const redirectUrl = new URL("/admin/vouchers", req.url);
    redirectUrl.searchParams.set("message", "Voucher berhasil dihapus");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const redirectUrl = new URL("/admin/vouchers", req.url);
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
      redirectUrl.searchParams.set("error", "Voucher tidak ditemukan");
    } else {
      redirectUrl.searchParams.set("error", "Gagal menghapus voucher");
    }
    return NextResponse.redirect(redirectUrl);
  }
}
