import { prisma } from "@/lib/prisma";
import { logChatAudit } from "@/lib/chat/audit";
import { ChatAuditAction } from "@prisma/client";

export async function scheduleReminder(threadId: string, hoursUntilReminder: number, _label: string) {
  const triggerTime = new Date(Date.now() + hoursUntilReminder * 60 * 60 * 1000);
  await prisma.chatReminder.upsert({
    where: { threadId_triggeredFor: { threadId, triggeredFor: triggerTime } },
    update: { sent: false },
    create: { threadId, triggeredFor: triggerTime },
  });
  void logChatAudit({
    threadId,
    action: ChatAuditAction.REMINDER_SCHEDULED,
    detail: triggerTime.toISOString(),
  });
}
