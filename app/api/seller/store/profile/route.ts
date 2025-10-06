import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const nameRaw = formData.get("name");
  const redirectTo = String(formData.get("redirectTo") || "/seller/settings");

  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(redirectTo, req.url);
  } catch {
    redirectUrl = new URL("/seller/settings", req.url);
  }

  if (redirectUrl.origin !== new URL(req.url).origin) {
    redirectUrl = new URL("/seller/settings", req.url);
  }

  if (!user) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

  if (!name) {
    redirectUrl.searchParams.set("error", "Nama toko wajib diisi.");
    return NextResponse.redirect(redirectUrl);
  }

  if (name.length < 3) {
    redirectUrl.searchParams.set("error", "Nama toko minimal 3 karakter.");
    return NextResponse.redirect(redirectUrl);
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true },
  });

  if (!account) {
    redirectUrl.searchParams.set("error", "Akun tidak ditemukan.");
    return NextResponse.redirect(redirectUrl);
  }

  if (account.isBanned) {
    return NextResponse.redirect(new URL("/seller/login?error=banned", req.url));
  }

  const baseSlugRaw = slugify(name);
  const baseSlug = baseSlugRaw.length > 0 ? baseSlugRaw : "toko";
  let slugCandidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({ where: { slug: slugCandidate } });
    if (!existing || existing.id === user.id) {
      break;
    }
    slugCandidate = `${baseSlug}-${counter++}`;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, slug: slugCandidate },
  });

  session.user = { ...user, name, slug: slugCandidate };
  await session.save();

  redirectUrl.searchParams.delete("error");
  redirectUrl.searchParams.set("updated", "1");

  const response = NextResponse.redirect(redirectUrl);

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      response.headers.append(key, value);
    }
  });

  return response;
}
