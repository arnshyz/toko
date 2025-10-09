import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { storeIsOnline: false, lastActiveAt: new Date() } as any,
    });
  }

  await session.destroy();
  return res;
}
