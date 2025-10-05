import { NextRequest } from "next/server";

import { handleGoogleCallback } from "./shared";

export async function GET(req: NextRequest) {
  return handleGoogleCallback(req);
}
