import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { publishChatEvent } from "@/lib/chat/events";
import { logChatAudit } from "@/lib/chat/audit";
import { hydrateThread } from "@/lib/chat/utils";
import { ChatAuditAction } from "@prisma/client";

const schema = z.object({
  reason: z.string().min(3).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const message = await prisma.chatMessage.findUnique({
    where: { id: params.messageId },
    include: { thread: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  const participant = await prisma.chatParticipant.findFirst({
    where: { threadId: message.threadId, userId: session.user.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await prisma.chatReport.create({
    data: {
      messageId: message.id,
      threadId: message.threadId,
      reporterId: session.user.id,
      reason: parsed.data.reason,
    },
  });
  const thread = await prisma.chatThread.findUnique({
    where: { id: message.threadId },
    include: { participants: true, lastMessage: { include: { attachments: true } } },
  });
  if (thread) {
    publishChatEvent({
      type: "thread.updated",
      thread: hydrateThread(thread),
    });
  }
  void logChatAudit({
    threadId: message.threadId,
    actorId: session.user.id,
    action: ChatAuditAction.MESSAGE_REPORTED,
    detail: parsed.data.reason,
  });
  return NextResponse.json({ report }, { status: 201 });
}
