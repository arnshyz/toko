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

  const courier = await prisma.courier.findUnique({ where: { id: params.id } });
  if (!courier) {
    return NextResponse.redirect(new URL(`/admin/couriers?error=${encodeURIComponent("Kurir tidak ditemukan")}`, req.url));
  }

  await prisma.courier.delete({ where: { id: courier.id } });

  return NextResponse.redirect(new URL(`/admin/couriers?message=${encodeURIComponent("Kurir dihapus")}`, req.url));
}
