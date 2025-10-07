import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Silakan masuk untuk melihat pesanan Anda." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              seller: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      review: true,
    },
  });

  return NextResponse.json(orders);
}
