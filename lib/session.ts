import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

type CookieStoreLike = Parameters<typeof getIronSession>[0];

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: "akay_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  slug: string;
  isAdmin: boolean;
};

export type SessionData = { user?: SessionUser };

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(
    cookies() as unknown as CookieStoreLike,
    sessionOptions,
  );
  return session;
}
