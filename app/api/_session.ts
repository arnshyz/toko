import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { NextRequest } from "next/server";
export async function getSession(req: NextRequest) {
  // @ts-ignore
  const res = new Response();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  return { session, res };
}
