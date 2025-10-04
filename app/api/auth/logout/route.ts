import { NextRequest, NextResponse } from "next/server";

import { getAppSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { session, res } = await getAppSessionFromRequest(req);
  await session.destroy();
  res.headers.set("Location", "/");
  res.status = 302;
  return res;
}

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/", req.url));
}
