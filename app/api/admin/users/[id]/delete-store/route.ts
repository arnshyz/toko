import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { StoreBadge } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      products: { select: { id: true } },
      warehouses: { select: { id: true } },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  const redirectUrl = new URL("/admin/users", req.url);

  if (target.products.length === 0 && target.warehouses.length === 0) {
    redirectUrl.searchParams.set("error", "Pengguna ini belum memiliki toko untuk dihapus.");
    return NextResponse.redirect(redirectUrl);
  }

  const hasSales = await prisma.orderItem.findFirst({ where: { sellerId: params.id } });

  if (hasSales) {
    redirectUrl.searchParams.set(
      "error",
      "Tidak dapat menghapus toko karena memiliki riwayat penjualan yang harus dipertahankan.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const defaultBadge: StoreBadge = "BASIC";

  await prisma.$transaction([
    prisma.product.deleteMany({ where: { sellerId: params.id } }),
    prisma.warehouse.deleteMany({ where: { ownerId: params.id } }),
    prisma.user.update({
      where: { id: params.id },
      data: {
        storeIsOnline: false,
        storeBadge: defaultBadge,
        storeFollowers: 0,
        storeFollowing: 0,
        storeRating: null,
        storeRatingCount: 0,
      },
    }),
  ]);

  redirectUrl.searchParams.set("message", "Toko berhasil dihapus.");
  return NextResponse.redirect(redirectUrl);
}
