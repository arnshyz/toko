import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logChatAudit } from "@/lib/chat/audit";
import { ChatAuditAction } from "@prisma/client";

const schema = z.object({
  targetUserId: z.string().min(1),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
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
  if (parsed.data.targetUserId === session.user.id) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
  const block = await prisma.chatBlock.upsert({
    where: { issuerId_targetId: { issuerId: session.user.id, targetId: parsed.data.targetUserId } },
    update: { reason: parsed.data.reason, expiresAt },
    create: {
      issuerId: session.user.id,
      targetId: parsed.data.targetUserId,
      reason: parsed.data.reason,
      expiresAt,
    },
  });
  void logChatAudit({
    actorId: session.user.id,
    action: ChatAuditAction.USER_BLOCKED,
    detail: `${parsed.data.targetUserId}:${parsed.data.reason ?? ""}`,
  });
  return NextResponse.json({ block }, { status: 201 });
}
