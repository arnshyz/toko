import { prisma } from "@/lib/prisma";
import {
  AttachmentScanStatus,
  ChatContextType,
  ChatMessageKind,
  ChatModerationState,
  ChatParticipantRole,
  ChatThreadType,
  ChatAuditAction,
  MessageDeliveryStatus,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import type {
  ChatMessageSummary,
  ChatThreadSummary,
  CreateThreadPayload,
  SendMessagePayload,
} from "@/types/chat";
import { scanMessageContent } from "./moderation";
import { publishChatEvent } from "./events";
import { enqueueNotification } from "./notifications";
import { scheduleReminder } from "./reminders";
import { hydrateMessage, hydrateThread } from "./utils";
import { logChatAudit } from "./audit";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const createThreadSchema = z.object({
  contextType: z.nativeEnum(ChatContextType),
  contextId: z.string().min(1),
  title: z.string().optional(),
  type: z.nativeEnum(ChatThreadType).optional(),
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.nativeEnum(ChatParticipantRole).optional(),
      }),
    )
    .min(1),
});

const sendMessageSchema = z
  .object({
    content: z.string().max(5000).optional(),
    kind: z.nativeEnum(ChatMessageKind).optional(),
    metadata: z.record(z.unknown()).optional(),
    attachments: z
      .array(
        z.object({
          url: z.string().url(),
          fileName: z.string().min(1),
          mimeType: z.string().min(1),
          size: z.number().int().nonnegative().max(MAX_ATTACHMENT_BYTES),
        }),
      )
      .optional(),
  })
  .refine((value) => Boolean(value.content?.trim()) || (value.attachments && value.attachments.length > 0), {
    message: "Message requires content or attachment",
    path: ["content"],
  });

export async function createThread(payload: CreateThreadPayload & { creatorId: string }): Promise<ChatThreadSummary> {
  const input = createThreadSchema.parse(payload);
  const uniqueParticipantIds = Array.from(new Set(input.participants.map((p) => p.userId)));
  if (!uniqueParticipantIds.includes(payload.creatorId)) {
    uniqueParticipantIds.push(payload.creatorId);
  }
  const candidates = await prisma.chatThread.findMany({
    where: {
      contextType: input.contextType,
      contextId: input.contextId,
      participants: {
        every: {
          userId: { in: uniqueParticipantIds },
        },
      },
    },
    include: { participants: true, lastMessage: { include: { attachments: true } } },
  });

  const existing = candidates.find((thread) => thread.participants.length === uniqueParticipantIds.length);
  if (existing) {
    return hydrateThread(existing);
  }

  const thread = await prisma.chatThread.create({
    data: {
      type: input.type ?? (uniqueParticipantIds.length > 2 ? ChatThreadType.GROUP : ChatThreadType.DIRECT),
      contextType: input.contextType,
      contextId: input.contextId,
      title: input.title,
      createdById: payload.creatorId,
      participants: {
        createMany: {
          data: uniqueParticipantIds.map((id) => ({
            userId: id,
            role:
              input.participants.find((p) => p.userId === id)?.role ??
              (id === payload.creatorId ? ChatParticipantRole.MEMBER : ChatParticipantRole.MEMBER),
          })),
        },
      },
    },
    include: {
      participants: true,
      lastMessage: { include: { attachments: true } },
    },
  });

  publishChatEvent({ type: "thread.updated", thread: hydrateThread(thread) });
  void logChatAudit({
    threadId: thread.id,
    actorId: payload.creatorId,
    action: ChatAuditAction.THREAD_CREATED,
    detail: `Thread created for ${input.contextType} ${input.contextId}`,
  });
  return hydrateThread(thread);
}

export async function getThreadSummary(threadId: string, userId: string): Promise<ChatThreadSummary | null> {
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, participants: { some: { userId } } },
    include: {
      participants: true,
      lastMessage: { include: { attachments: true } },
    },
  });
  return thread ? hydrateThread(thread) : null;
}

export async function listThreads(userId: string, take = 20, cursor?: string): Promise<ChatThreadSummary[]> {
  const threads = await prisma.chatThread.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      participants: true,
      lastMessage: { include: { attachments: true } },
    },
  });
  return threads.map(hydrateThread);
}

export async function listMessages(
  threadId: string,
  userId: string,
  take = 30,
  cursor?: string,
): Promise<ChatMessageSummary[]> {
  const participant = await prisma.chatParticipant.findFirst({
    where: { threadId, userId, isActive: true },
  });
  if (!participant) {
    throw new Error("Unauthorized to view thread");
  }

  const messages = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { sentAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { attachments: true },
  });
  return messages.reverse().map(hydrateMessage);
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  payload: SendMessagePayload,
): Promise<ChatMessageSummary> {
  const input = sendMessageSchema.parse(payload);
  const participant = await prisma.chatParticipant.findFirst({
    where: { threadId, userId: senderId, isActive: true },
    include: { thread: { include: { participants: true } } },
  });
  if (!participant) {
    throw new Error("Not a participant");
  }

  const otherParticipants = participant.thread.participants.filter((p) => p.userId !== senderId);
  if (otherParticipants.length === 0) {
    throw new Error("Thread has no recipients");
  }

  const blocked = await prisma.chatBlock.findFirst({
    where: {
      OR: otherParticipants.map((p) => ({
        issuerId: p.userId,
        targetId: senderId,
      })).concat(
        otherParticipants.map((p) => ({
          issuerId: senderId,
          targetId: p.userId,
        })),
      ),
    },
  });
  if (blocked) {
    throw new Error("Messaging blocked between participants");
  }

  const contentText = input.content?.trim() ?? "";
  const { cleanText, flagged, matchedTerms } = contentText ? scanMessageContent(contentText) : { cleanText: "", flagged: false, matchedTerms: [] };

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.chatMessage.create({
      data: {
        threadId,
        senderId,
        content: contentText ? cleanText : null,
        kind: input.kind ?? (input.attachments && input.attachments.length > 0 ? ChatMessageKind.ATTACHMENT : ChatMessageKind.TEXT),
        metadata:
  input.metadata === undefined
    ? undefined
    : input.metadata === null
      ? Prisma.JsonNull
      : (input.metadata as Prisma.InputJsonValue),

        moderationState: flagged ? ChatModerationState.FLAGGED : ChatModerationState.APPROVED,
      },
      include: { attachments: true },
    });

    if (input.attachments && input.attachments.length > 0) {
      await tx.chatAttachment.createMany({
        data: input.attachments.map((attachment) => ({
          messageId: createdMessage.id,
          url: attachment.url,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          scanStatus: AttachmentScanStatus.PENDING,
        })),
      });
    }

    await tx.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessageId: createdMessage.id,
        updatedAt: new Date(),
      },
    });

    const participantRecords = await tx.chatParticipant.findMany({ where: { threadId } });
    await tx.chatMessageReceipt.createMany({
      data: participantRecords
        .filter((p) => p.userId !== senderId)
        .map((p) => ({
          messageId: createdMessage.id,
          participantId: p.id,
          status: MessageDeliveryStatus.SENT,
        })),
      skipDuplicates: true,
    });

    if (flagged) {
      await tx.chatReport.create({
        data: {
          messageId: createdMessage.id,
          threadId,
          reporterId: senderId,
          reason: `Auto-flagged terms: ${matchedTerms.join(", ")}`,
        },
      });
    }

    const hydrated = await tx.chatMessage.findUniqueOrThrow({
      where: { id: createdMessage.id },
      include: { attachments: true },
    });

    return { hydrated, participantRecords };
  });

  const { hydrated, participantRecords } = message;
  const summary = hydrateMessage(hydrated);
  publishChatEvent({ type: "message.created", threadId, message: summary });
  publishChatEvent({ type: "thread.updated", thread: await getThreadSummaryOrThrow(threadId) });
  void logChatAudit({
    threadId,
    actorId: senderId,
    action: ChatAuditAction.MESSAGE_SENT,
    detail: summary.content ?? summary.attachments.map((a) => a.fileName).join(", "),
  });
  void enqueueNotification({
    threadId,
    recipientIds: participantRecords.filter((p) => p.userId !== senderId).map((p) => p.userId),
    message: summary.content ?? "Attachment",
    type: "chat",
  });
  void scheduleReminder(threadId, 2, "reply-reminder");
  if (flagged) {
    void logChatAudit({
      threadId,
      actorId: senderId,
      action: ChatAuditAction.MESSAGE_FLAGGED,
      detail: matchedTerms.join(", "),
    });
    void enqueueNotification({
      threadId,
      recipientIds: participantRecords.filter((p) => p.userId !== senderId).map((p) => p.userId),
      message: `Message flagged: ${matchedTerms.join(", ")}`,
      type: "moderation",
    });
  }
  return summary;
}

export async function acknowledgeMessage(
  messageId: string,
  participantId: string,
  status: MessageDeliveryStatus,
): Promise<void> {
  await prisma.chatMessageReceipt.upsert({
    where: {
      messageId_participantId_status: {
        messageId,
        participantId,
        status,
      },
    },
    create: { messageId, participantId, status },
    update: { occurredAt: new Date() },
  });

  const participant = await prisma.chatParticipant.findUnique({ where: { id: participantId } });
  if (participant) {
    await prisma.chatParticipant.update({
      where: { id: participantId },
      data: { lastReadAt: new Date(), lastReadMessageId: messageId },
    });
    publishChatEvent({
      type: "message.receipt",
      threadId: participant.threadId,
      messageId,
      status,
      userId: participant.userId,
    });
  }
}

async function getThreadSummaryOrThrow(threadId: string): Promise<ChatThreadSummary> {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { participants: true, lastMessage: { include: { attachments: true } } },
  });
  if (!thread) {
    throw new Error("Thread not found");
  }
  return hydrateThread(thread);
}
