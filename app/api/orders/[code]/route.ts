import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getSession();
  const userId = session.user?.id;
  const isAdmin = session.user?.isAdmin ?? false;

  const o = await prisma.order.findUnique({
    where: { orderCode: params.code },
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
      logs: true,
      returns: true,
      review: true,
    },
  });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (o.buyerId && o.buyerId !== userId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(o);
}
