import Redis from "ioredis";

const globalRedis = globalThis as unknown as {
  __REDIS_CLIENT__?: Redis | null;
};

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!globalRedis.__REDIS_CLIENT__) {
    globalRedis.__REDIS_CLIENT__ = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }
  return globalRedis.__REDIS_CLIENT__ ?? null;
}

export async function disconnectRedis(): Promise<void> {
  if (globalRedis.__REDIS_CLIENT__) {
    await globalRedis.__REDIS_CLIENT__?.quit().catch(() => undefined);
    globalRedis.__REDIS_CLIENT__ = null;
  }
}
