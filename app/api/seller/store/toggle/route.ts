import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const status = String(formData.get("status") || "").toLowerCase();

  if (status !== "online" && status !== "offline") {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const res = new NextResponse(null);
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, storeIsOnline: true, sellerOnboardingStatus: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  if (account.isBanned) {
    return NextResponse.redirect(new URL("/seller/login?error=banned", req.url));
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return NextResponse.redirect(new URL("/seller/onboarding", req.url));
  }

  const shouldOnline = status === "online";

  if (account.storeIsOnline !== shouldOnline) {
    await prisma.user.update({
      where: { id: user.id },
      data: { storeIsOnline: shouldOnline, lastActiveAt: new Date() } as any,
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() } as any,
    });
  }

  return NextResponse.redirect(new URL("/seller/dashboard", req.url));
}

