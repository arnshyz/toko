import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth";

export async function GET() {
  const session = await getAppSession();
  return NextResponse.json({ user: session.user ?? null });
}
