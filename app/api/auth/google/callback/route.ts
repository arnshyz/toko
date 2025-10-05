import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

const STATE_COOKIE = "google_oauth_state";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

function clearStateCookie(response: NextResponse) {
  response.cookies.set({
    name: STATE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

async function buildUniqueSlug(base: string) {
  const defaultBase = base || "seller";
  let slugBase = slugify(defaultBase);
  if (!slugBase) {
    slugBase = slugify("seller");
  }

  let slug = slugBase;
  let attempt = 1;

  while (await prisma.user.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${attempt}`;
    attempt += 1;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = req.cookies.get(STATE_COOKIE)?.value;

  if (error || !code || !state || !storedState || state !== storedState) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google", url.origin)),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google_config", url.origin)),
    );
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google_token", url.origin)),
    );
  }

  const tokens = await tokenResponse.json();
  const accessToken: string | undefined = tokens.access_token;

  if (!accessToken) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google_token", url.origin)),
    );
  }

  const profileResponse = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google_profile", url.origin)),
    );
  }

  const profile = await profileResponse.json();
  const email = typeof profile.email === "string" ? profile.email.toLowerCase() : "";
  const emailVerified = profile.email_verified !== false;
  const fullName =
    typeof profile.name === "string" && profile.name.trim().length > 0
      ? profile.name
      : email.split("@")[0];

  if (!email || !emailVerified) {
    return clearStateCookie(
      NextResponse.redirect(new URL("/seller/login?error=google_email", url.origin)),
    );
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordFallback = randomUUID();
    const passwordHash = await bcrypt.hash(passwordFallback, 10);
    const slug = await buildUniqueSlug(fullName);

    user = await prisma.user.create({
      data: {
        name: fullName || "Seller Akay",
        email,
        passwordHash,
        slug,
        isAdmin: false,
      },
    });
  }

  const redirectTo = new URL("/seller/dashboard", url.origin);
  const response = clearStateCookie(NextResponse.redirect(redirectTo));

  const session = await getIronSession<{ user?: SessionUser }>(req, response, sessionOptions);
  session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    slug: user.slug,
    isAdmin: user.isAdmin,
  };
  await session.save();

  return response;
}
