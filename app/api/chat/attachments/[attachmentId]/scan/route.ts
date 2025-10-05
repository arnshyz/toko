import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AttachmentScanStatus } from "@prisma/client";

const schema = z.object({
  status: z.nativeEnum(AttachmentScanStatus),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { attachmentId: string } },
) {
  const session = await getSession();
  if (!session.user || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const attachment = await prisma.chatAttachment.update({
    where: { id: params.attachmentId },
    data: { scanStatus: parsed.data.status, scannedAt: new Date() },
  });
  return NextResponse.json({ attachment });
}
