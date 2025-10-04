import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { sessionOptions, SessionUser } from "./session";

export type AppSession = { user?: SessionUser };

export async function getAppSession() {
  return getIronSession<AppSession>(cookies(), sessionOptions);
}

export async function getAppSessionFromRequest(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<AppSession>(req, res, sessionOptions);
  return { session, res };
}

export function getSafeRedirect(redirect: string | null | undefined, fallback: string) {
  if (!redirect) return fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return fallback;
  return redirect;
}
