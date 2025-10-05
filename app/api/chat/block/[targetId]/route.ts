import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logChatAudit } from "@/lib/chat/audit";
import { ChatAuditAction } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { targetId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.chatBlock.deleteMany({
    where: { issuerId: session.user.id, targetId: params.targetId },
  });
  void logChatAudit({
    actorId: session.user.id,
    action: ChatAuditAction.USER_UNBLOCKED,
    detail: params.targetId,
  });
  return NextResponse.json({ ok: true });
}
