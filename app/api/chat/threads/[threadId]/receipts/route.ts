import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { acknowledgeMessage } from "@/lib/chat/service";
import { prisma } from "@/lib/prisma";
import { MessageDeliveryStatus } from "@prisma/client";

const schema = z.object({
  messageId: z.string().min(1),
  status: z.nativeEnum(MessageDeliveryStatus),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const session = await getSession();
  if (!session.user) {
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

  const participant = await prisma.chatParticipant.findFirst({
    where: { threadId: params.threadId, userId: session.user.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  try {
    await acknowledgeMessage(parsed.data.messageId, participant.id, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
