import { getRedis } from "@/lib/redis";

const PRESENCE_KEY_PREFIX = "chat:presence";
const TYPING_KEY_PREFIX = "chat:typing";
const ONLINE_TTL_SECONDS = 120;
const TYPING_TTL_SECONDS = 10;

function buildPresenceKey(threadId: string, userId: string) {
  return `${PRESENCE_KEY_PREFIX}:${threadId}:${userId}`;
}

function buildTypingKey(threadId: string, userId: string) {
  return `${TYPING_KEY_PREFIX}:${threadId}:${userId}`;
}

export async function markOnline(threadId: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(buildPresenceKey(threadId, userId), "online", "EX", ONLINE_TTL_SECONDS);
}

export async function markOffline(threadId: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(buildPresenceKey(threadId, userId));
}

export async function getPresence(threadId: string, userId: string): Promise<"online" | "offline"> {
  const redis = getRedis();
  if (!redis) return "offline";
  const value = await redis.get(buildPresenceKey(threadId, userId));
  return value ? "online" : "offline";
}

export async function setTyping(threadId: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(buildTypingKey(threadId, userId), "typing", "EX", TYPING_TTL_SECONDS);
}

export async function isTyping(threadId: string, userId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const value = await redis.get(buildTypingKey(threadId, userId));
  return Boolean(value);
}
