import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const avatar = await prisma.userAvatar.findUnique({ where: { userId: params.userId } });
  if (!avatar) {
    return new Response("Not found", { status: 404 });
  }

  const body = new Uint8Array(avatar.data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
