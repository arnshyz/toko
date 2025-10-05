import { ChatContextType, ChatMessageKind, ChatParticipantRole, ChatThreadType, MessageDeliveryStatus } from "@prisma/client";

export type ChatThreadSummary = {
  id: string;
  type: ChatThreadType;
  contextType: ChatContextType;
  contextId: string;
  title?: string | null;
  updatedAt: Date;
  lastMessage?: ChatMessageSummary | null;
  participants: ChatParticipantSummary[];
};

export type ChatParticipantSummary = {
  id: string;
  userId: string;
  role: ChatParticipantRole;
  lastReadAt?: Date | null;
  isActive: boolean;
};

export type ChatMessageSummary = {
  id: string;
  threadId: string;
  senderId: string;
  content?: string | null;
  kind: ChatMessageKind;
  metadata?: Record<string, unknown> | null;
  sentAt: Date;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  moderationState: string;
  attachments: ChatAttachmentSummary[];
};

export type ChatAttachmentSummary = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  scanStatus: string;
};

export type CreateThreadPayload = {
  contextType: ChatContextType;
  contextId: string;
  title?: string;
  type?: ChatThreadType;
  participants: { userId: string; role?: ChatParticipantRole }[];
};

export type SendMessagePayload = {
  content?: string;
  kind?: ChatMessageKind;
  metadata?: Record<string, unknown>;
  attachments?: { url: string; fileName: string; mimeType: string; size: number }[];
};

export type UpdateReceiptPayload = {
  status: MessageDeliveryStatus;
  messageId: string;
};

export type ChatEvent =
  | { type: "message.created"; threadId: string; message: ChatMessageSummary }
  | { type: "thread.updated"; thread: ChatThreadSummary }
  | { type: "participant.typing"; threadId: string; userId: string; expiresAt: number }
  | { type: "participant.presence"; threadId: string; userId: string; status: "online" | "offline" }
  | { type: "message.receipt"; threadId: string; messageId: string; status: MessageDeliveryStatus; userId: string };
