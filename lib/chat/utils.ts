import type { Prisma } from "@prisma/client";
import type { ChatMessageSummary, ChatThreadSummary } from "@/types/chat";

export function hydrateThread(
  thread: Prisma.ChatThreadGetPayload<{ include: { participants: true; lastMessage: { include: { attachments: true } } } }>,
): ChatThreadSummary {
  return {
    id: thread.id,
    type: thread.type,
    contextType: thread.contextType,
    contextId: thread.contextId,
    title: thread.title,
    updatedAt: thread.updatedAt,
    lastMessage: thread.lastMessage ? hydrateMessage(thread.lastMessage) : null,
    participants: thread.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      lastReadAt: p.lastReadAt ?? undefined,
      isActive: p.isActive,
    })),
  };
}

export function hydrateMessage(
  message: Prisma.ChatMessageGetPayload<{ include: { attachments: true } }>,
): ChatMessageSummary {
  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    content: message.content ?? undefined,
    kind: message.kind,
    metadata: (message.metadata as Record<string, unknown> | null) ?? undefined,
    sentAt: message.sentAt,
    deliveredAt: message.deliveredAt ?? undefined,
    readAt: message.readAt ?? undefined,
    moderationState: message.moderationState,
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      scanStatus: attachment.scanStatus,
    })),
  };
}
