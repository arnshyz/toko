import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

const MAX_FILE_SIZE = 1_000_000; // 1 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const sessionUser = session.user;

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    const redirectUrl = new URL("/seller/dashboard", req.url);
    redirectUrl.searchParams.set("error", "Harap pilih file gambar yang valid");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  if (!ALLOWED_MIME.has(file.type)) {
    const redirectUrl = new URL("/seller/dashboard", req.url);
    redirectUrl.searchParams.set("error", "Format gambar harus JPG, PNG, atau WEBP");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    const redirectUrl = new URL("/seller/dashboard", req.url);
    redirectUrl.searchParams.set("error", "Ukuran gambar melebihi 1 MB");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  const data = Buffer.from(arrayBuffer);

  const avatarPath = `/api/users/${sessionUser.id}/avatar?ts=${Date.now()}`;

  await prisma.$transaction([
    prisma.userAvatar.upsert({
      where: { userId: sessionUser.id },
      create: {
        userId: sessionUser.id,
        mimeType: file.type,
        data,
      },
      update: {
        mimeType: file.type,
        data,
      },
    }),
    prisma.user.update({
      where: { id: sessionUser.id },
      data: { avatarUrl: avatarPath },
    }),
  ]);

  const redirectUrl = new URL("/seller/dashboard", req.url);
  redirectUrl.searchParams.set("message", "Foto profil berhasil diperbarui");
  const redirectResponse = NextResponse.redirect(redirectUrl);
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      redirectResponse.headers.append(key, value);
    }
  });
  return redirectResponse;
}
