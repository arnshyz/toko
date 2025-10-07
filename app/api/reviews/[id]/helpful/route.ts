import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Silakan masuk untuk menyukai ulasan." }, { status: 401 });
  }

  const review = await prisma.orderReview.findUnique({
    where: { id: params.id },
    select: { id: true, buyerId: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Ulasan tidak ditemukan." }, { status: 404 });
  }

  if (review.buyerId === userId) {
    return NextResponse.json({ error: "Anda tidak dapat menyukai ulasan Anda sendiri." }, { status: 400 });
  }

  const existingHelpful = await prisma.orderReviewHelpful.findUnique({
    where: {
      reviewId_userId: {
        reviewId: review.id,
        userId,
      },
    },
  });

  let liked = false;

  if (existingHelpful) {
    await prisma.orderReviewHelpful.delete({
      where: {
        reviewId_userId: {
          reviewId: review.id,
          userId,
        },
      },
    });
  } else {
    await prisma.orderReviewHelpful.create({
      data: {
        reviewId: review.id,
        userId,
      },
    });
    liked = true;
  }

  const helpfulCount = await prisma.orderReviewHelpful.count({
    where: { reviewId: review.id },
  });

  return NextResponse.json({ liked, helpfulCount });
}
