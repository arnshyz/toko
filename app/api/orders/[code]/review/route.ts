import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getSession();
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Silakan masuk untuk menilai pesanan." }, { status: 401 });
  }

  const { rating, comment } = (await req.json().catch(() => ({}))) as {
    rating?: unknown;
    comment?: unknown;
  };

  const parsedRating = typeof rating === "number" ? rating : Number(rating);
  const trimmedComment = typeof comment === "string" ? comment.trim() : "";

  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: "Nilai bintang harus antara 1 hingga 5." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderCode: params.code },
    select: { id: true, buyerId: true },
  });

  if (!order || order.buyerId !== userId) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const review = await prisma.orderReview.upsert({
    where: { orderId: order.id },
    update: {
      rating: Math.round(parsedRating),
      comment: trimmedComment || null,
    },
    create: {
      orderId: order.id,
      buyerId: userId,
      rating: Math.round(parsedRating),
      comment: trimmedComment || null,
    },
  });

  return NextResponse.json(review);
}
