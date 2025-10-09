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

  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) {
    return NextResponse.redirect(new URL(`/admin/categories?error=${encodeURIComponent("Kategori tidak ditemukan")}`, req.url));
  }

  const fallbackCategory = await prisma.category.findFirst({
    where: { id: { not: category.id }, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const fallbackSlug = fallbackCategory?.slug ?? "umum";

  await prisma.$transaction([
    prisma.category.updateMany({ where: { parentId: category.id }, data: { parentId: null } }),
    prisma.product.updateMany({ where: { category: category.slug }, data: { category: fallbackSlug } }),
    prisma.category.delete({ where: { id: category.id } }),
  ]);

  return NextResponse.redirect(new URL(`/admin/categories?message=${encodeURIComponent("Kategori dihapus")}`, req.url));
}
