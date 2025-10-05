import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

const storeBadges = ["BASIC", "STAR", "STAR_PLUS", "MALL", "PREMIUM"] as const;

type StoreBadge = (typeof storeBadges)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const badge = formData.get("badge");

  if (typeof badge !== "string" || !storeBadges.includes(badge as StoreBadge)) {
    return NextResponse.json({ error: "Badge tidak valid" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { storeBadge: badge as StoreBadge },
  });

  return NextResponse.redirect(new URL("/admin/users", req.url));
}
