import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse(null);
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  if (!user) {
    return NextResponse.redirect(new URL("/seller/login?error=unauthorized", req.url));
  }

  const redirectUrl = new URL("/seller/flash-sales", req.url);

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL("/seller/login?error=banned", req.url));
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return NextResponse.redirect(new URL("/seller/onboarding", req.url));
  }

  const sale = await prisma.flashSale.findUnique({
    where: { id: params.id },
    select: { sellerId: true },
  });

  if (!sale || sale.sellerId !== user.id) {
    redirectUrl.searchParams.set("error", "Flash sale tidak ditemukan.");
    return NextResponse.redirect(redirectUrl);
  }

  await prisma.flashSale.delete({ where: { id: params.id } });

  redirectUrl.searchParams.set("success", "Flash sale berhasil dihapus.");
  return NextResponse.redirect(redirectUrl);
}
