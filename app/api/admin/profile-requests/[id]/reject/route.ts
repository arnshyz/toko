import { NextRequest, NextResponse } from "next/server";
import { ProfileChangeStatus } from "@prisma/client";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const request = await prisma.profileChangeRequest.findUnique({ where: { id: params.id } });
  if (!request || request.status !== ProfileChangeStatus.PENDING) {
    const redirectUrl = new URL("/admin/users", req.url);
    redirectUrl.searchParams.set("error", "Permintaan tidak ditemukan atau sudah diproses");
    return NextResponse.redirect(redirectUrl);
  }

  await prisma.profileChangeRequest.update({
    where: { id: request.id },
    data: {
      status: ProfileChangeStatus.REJECTED,
      resolvedAt: new Date(),
      resolvedById: actor.id,
    },
  });

  const redirectUrl = new URL("/admin/users", req.url);
  redirectUrl.searchParams.set("message", "Permintaan profil ditolak");
  const redirectResponse = NextResponse.redirect(redirectUrl);
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      redirectResponse.headers.append(key, value);
    }
  });
  return redirectResponse;
}
