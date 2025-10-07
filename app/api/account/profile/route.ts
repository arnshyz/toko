import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";

export const runtime = "nodejs";

function resolveRedirect(redirectTo: FormDataEntryValue | null, reqUrl: string, fallback: string) {
  const base = new URL(reqUrl);
  if (typeof redirectTo !== "string" || redirectTo.trim().length === 0) {
    return new URL(fallback, base);
  }

  try {
    const target = new URL(redirectTo, base);
    if (target.origin !== base.origin) {
      return new URL(fallback, base);
    }
    return target;
  } catch {
    return new URL(fallback, base);
  }
}

function mergeSessionCookies(source: NextResponse, target: NextResponse) {
  source.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      target.headers.append(key, value);
    }
  });
  return target;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeUsername(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase();
}

function sanitizeAvatarUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL harus menggunakan protokol http atau https");
    }
    return trimmed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL foto profil tidak valid";
    throw new Error(message);
  }
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  const form = await req.formData();
  const redirectUrl = resolveRedirect(form.get("redirectTo"), req.url, "/account");

  if (!actor) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  const nameRaw = form.get("name");
  const emailRaw = form.get("email");
  const usernameRaw = form.get("username");
  const phoneRaw = form.get("phoneNumber");
  const genderRaw = form.get("gender");
  const avatarRaw = form.get("avatarUrl");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const usernameNormalized = typeof usernameRaw === "string" ? normalizeUsername(usernameRaw) : "";
  const phoneNumber = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  const gender = typeof genderRaw === "string" && genderRaw ? genderRaw : "";

  let avatarUrl: string | null = null;

  try {
    if (typeof avatarRaw === "string") {
      avatarUrl = sanitizeAvatarUrl(avatarRaw);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL foto profil tidak valid";
    redirectUrl.searchParams.set("profileError", message);
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  if (!name) {
    redirectUrl.searchParams.set("profileError", "Nama wajib diisi.");
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  if (!email || !validateEmail(email)) {
    redirectUrl.searchParams.set("profileError", "Email tidak valid.");
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  if (usernameNormalized && usernameNormalized.length < 3) {
    redirectUrl.searchParams.set("profileError", "Username minimal 3 karakter.");
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  if (phoneNumber && phoneNumber.length < 6) {
    redirectUrl.searchParams.set("profileError", "Nomor telepon minimal 6 digit.");
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  const allowedGenders = ["MALE", "FEMALE", "OTHER"] as const;
  let genderValue: typeof allowedGenders[number] | null = null;
  if (gender) {
    if (!allowedGenders.includes(gender as (typeof allowedGenders)[number])) {
      redirectUrl.searchParams.set("profileError", "Jenis kelamin tidak valid.");
      redirectUrl.searchParams.delete("profileUpdated");
      const response = NextResponse.redirect(redirectUrl);
      return mergeSessionCookies(res, response);
    }
    genderValue = gender as (typeof allowedGenders)[number];
  }

  try {
    await prisma.user.update({
      where: { id: actor.id },
      data: {
        name,
        email,
        username: usernameNormalized ? usernameNormalized : null,
        phoneNumber: phoneNumber || null,
        gender: genderValue ?? null,
        avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectUrl.searchParams.set("profileError", "Username sudah digunakan.");
    } else {
      const message = error instanceof Error ? error.message : "Gagal memperbarui profil.";
      redirectUrl.searchParams.set("profileError", message);
    }
    redirectUrl.searchParams.delete("profileUpdated");
    const response = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(res, response);
  }

  session.user = { ...actor, name, email };
  await session.save();

  redirectUrl.searchParams.delete("profileError");
  redirectUrl.searchParams.set("profileUpdated", "1");

  const response = NextResponse.redirect(redirectUrl);
  return mergeSessionCookies(res, response);
}
