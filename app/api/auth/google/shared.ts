import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const STATE_COOKIE = "google_oauth_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

type RedirectOptions = {
  callbackPath?: string;
};

function buildCallbackPath(req: NextRequest, override?: string) {
  if (override) {
    return override;
  }

  const currentPath = req.nextUrl.pathname.replace(/\/$/, "");
  const basePath = currentPath.length > 0 ? currentPath : "";
  return `${basePath}/callback`;
}

export function buildGoogleRedirectUri(
  req: NextRequest,
  options: RedirectOptions = {},
) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  const callbackUrl = req.nextUrl.clone();
  callbackUrl.pathname = buildCallbackPath(req, options.callbackPath);
  callbackUrl.search = "";
  callbackUrl.hash = "";
  return callbackUrl.toString();
}

export function createGoogleAuthRedirect(
  req: NextRequest,
  options: RedirectOptions = {},
) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 },
    );
  }

  const redirectUri = buildGoogleRedirectUri(req, options);
  const state = randomUUID();
  const target = new URL(GOOGLE_AUTH_ENDPOINT);

  target.searchParams.set("client_id", clientId);
  target.searchParams.set("redirect_uri", redirectUri);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", "openid email profile");
  target.searchParams.set("state", state);
  target.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(target);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
