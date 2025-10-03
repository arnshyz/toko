import { IronSessionOptions } from "iron-session";
export const sessionOptions: IronSessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: "akay_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};
export type SessionUser = { id: string; name: string; email: string; slug: string; isAdmin: boolean; };
