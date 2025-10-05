// types/chat.ts (minimal)
export type ChatThreadSummary = {
  id: string;
  orderId: string;
  createdAt: Date;
};

export type ChatMessageDTO = {
  id: string;
  threadId: string;
  sender: string;            // "buyer:<phone>" | "seller:<userId>"
  content: string | null;
  createdAt: Date;
};
