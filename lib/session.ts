import type { IronSession, SessionOptions } from "iron-session";

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
  const [{ cookies }, { getIronSession }] = await Promise.all([
    import("next/headers"),
    import("iron-session"),
  ]);

  return getIronSession<SessionData>(
    cookies() as unknown as any,
    sessionOptions,
  );
}

