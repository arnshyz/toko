import { NextRequest } from "next/server";

import { handleGoogleCallback } from "@/app/api/auth/google/callback/shared";

export async function GET(req: NextRequest) {
  return handleGoogleCallback(req);
}
