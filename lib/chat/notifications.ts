import { getRedis } from "@/lib/redis";

export type NotificationPayload = {
  threadId: string;
  recipientIds: string[];
  message: string;
  type: "chat" | "reminder" | "moderation";
};

export async function enqueueNotification(payload: NotificationPayload) {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  await redis.lpush("chat:notification-queue", JSON.stringify(payload));
}
