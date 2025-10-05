import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { productId: string; imageId: string } }) {
  const image = await prisma.productImage.findFirst({
    where: { id: params.imageId, productId: params.productId },
  });

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  const body = new Uint8Array(image.data);

  return new Response(body, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
