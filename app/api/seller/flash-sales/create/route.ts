import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export const runtime = "nodejs";

function redirectWithMessage(url: URL, message: string, key: string) {
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const productId = String(form.get("productId") || "").trim();
  const discountRaw = String(form.get("discountPercent") || "").trim();
  const startAtRaw = String(form.get("startAt") || "").trim();
  const endAtRaw = String(form.get("endAt") || "").trim();

  const discountPercent = Number.parseInt(discountRaw, 10);
  const startAt = startAtRaw ? new Date(startAtRaw) : null;
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  const res = new NextResponse(null);
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  const redirectUrl = new URL("/seller/flash-sales", req.url);

  if (!user) {
    return NextResponse.redirect(new URL("/seller/login?error=unauthorized", req.url));
  }

  if (!productId || !startAt || !endAt || Number.isNaN(discountPercent)) {
    return redirectWithMessage(redirectUrl, "Mohon lengkapi data flash sale.", "error");
  }

  if (discountPercent < 1 || discountPercent > 90) {
    return redirectWithMessage(redirectUrl, "Diskon harus antara 1-90%.", "error");
  }

  if (endAt <= startAt) {
    return redirectWithMessage(redirectUrl, "Waktu berakhir harus setelah waktu mulai.", "error");
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true },
  });

  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL("/seller/login?error=banned", req.url));
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });

  if (!product || product.sellerId !== user.id) {
    return redirectWithMessage(redirectUrl, "Produk tidak ditemukan.", "error");
  }

  const overlapping = await prisma.flashSale.findFirst({
    where: {
      productId,
      AND: [{ startAt: { lte: endAt } }, { endAt: { gte: startAt } }],
    },
  });

  if (overlapping) {
    return redirectWithMessage(
      redirectUrl,
      "Produk tersebut sudah memiliki flash sale pada rentang waktu itu.",
      "error",
    );
  }

  await prisma.flashSale.create({
    data: {
      sellerId: user.id,
      productId,
      discountPercent,
      startAt,
      endAt,
    },
  });

  return redirectWithMessage(redirectUrl, "Flash sale berhasil dibuat.", "success");
}
