import type { SessionOptions } from "iron-session";

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
