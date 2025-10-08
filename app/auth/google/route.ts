import { NextRequest } from "next/server";

import { createGoogleAuthRedirect } from "@/app/api/auth/google/shared";

export async function GET(req: NextRequest) {
  return createGoogleAuthRedirect(req, { callbackPath: "/auth/google/callback" });
}
