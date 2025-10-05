import { prisma } from "@/lib/prisma";
import { ChatAuditAction } from "@prisma/client";

export async function logChatAudit(params: {
  threadId?: string;
  actorId?: string;
  action: ChatAuditAction;
  detail?: string;
}) {
  await prisma.chatAuditLog.create({
    data: {
      threadId: params.threadId,
      actorId: params.actorId,
      action: params.action,
      detail: params.detail,
    },
  });
}
