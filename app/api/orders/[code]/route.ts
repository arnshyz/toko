import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
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
    },
  });
  if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(o);
}
