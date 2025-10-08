import { NextRequest } from "next/server";

import { createGoogleAuthRedirect } from "./shared";

export async function GET(req: NextRequest) {
  return createGoogleAuthRedirect(req);
}
