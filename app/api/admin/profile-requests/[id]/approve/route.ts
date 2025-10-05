import { NextRequest, NextResponse } from "next/server";
import { ProfileChangeField, ProfileChangeStatus } from "@prisma/client";
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

  const request = await prisma.profileChangeRequest.findUnique({
    where: { id: params.id },
    include: {
      user: true,
    },
  });

  if (!request || request.status !== ProfileChangeStatus.PENDING) {
    const redirectUrl = new URL("/admin/users", req.url);
    redirectUrl.searchParams.set("error", "Permintaan tidak ditemukan atau sudah diproses");
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/admin/users", req.url);

  try {
    await prisma.$transaction(async (tx) => {
      if (request.field === ProfileChangeField.STORE_NAME) {
        await tx.user.update({
          where: { id: request.userId },
          data: { storeName: request.newValue },
        });
      } else if (request.field === ProfileChangeField.EMAIL) {
        const duplicate = await tx.user.findUnique({ where: { email: request.newValue } });
        if (duplicate && duplicate.id !== request.userId) {
          throw new Error("Email sudah digunakan pengguna lain");
        }
        await tx.user.update({
          where: { id: request.userId },
          data: { email: request.newValue },
        });
      }

      await tx.profileChangeRequest.update({
        where: { id: request.id },
        data: {
          status: ProfileChangeStatus.APPROVED,
          resolvedAt: new Date(),
          resolvedById: actor.id,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyetujui permintaan";
    redirectUrl.searchParams.set("error", message);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  redirectUrl.searchParams.set("message", "Permintaan profil berhasil disetujui");
  const redirectResponse = NextResponse.redirect(redirectUrl);
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      redirectResponse.headers.append(key, value);
    }
  });
  return redirectResponse;
}
