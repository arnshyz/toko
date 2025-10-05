import { EventEmitter } from "events";
import type { ChatEvent } from "@/types/chat";

const globalRef = globalThis as unknown as {
  __CHAT_EVENT_EMITTER__?: EventEmitter;
  __CHAT_EVENT_CHANNEL__?: BroadcastChannel | null;
  __CHAT_EVENT_LISTENERS__?: Map<string, Set<(event: ChatEvent) => void>>;
};

function ensureEmitter(): EventEmitter {
  if (!globalRef.__CHAT_EVENT_EMITTER__) {
    globalRef.__CHAT_EVENT_EMITTER__ = new EventEmitter();
    globalRef.__CHAT_EVENT_EMITTER__.setMaxListeners(1000);
  }
  return globalRef.__CHAT_EVENT_EMITTER__;
}

function ensureListenerMap() {
  if (!globalRef.__CHAT_EVENT_LISTENERS__) {
    globalRef.__CHAT_EVENT_LISTENERS__ = new Map();
  }
  return globalRef.__CHAT_EVENT_LISTENERS__;
}

function ensureBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    globalRef.__CHAT_EVENT_CHANNEL__ = null;
    return null;
  }
  if (!globalRef.__CHAT_EVENT_CHANNEL__) {
    const channel = new BroadcastChannel("chat-events");
    channel.addEventListener("message", (event) => {
      const payload = event.data as ChatEvent;
      ensureEmitter().emit(payload.type, payload);
      const listeners = ensureListenerMap().get(payload.type);
      if (listeners) {
        for (const listener of listeners) {
          listener(payload);
        }
      }
    });
    globalRef.__CHAT_EVENT_CHANNEL__ = channel;
  }
  return globalRef.__CHAT_EVENT_CHANNEL__;
}

export function publishChatEvent(event: ChatEvent) {
  ensureBroadcastChannel()?.postMessage(event);
  ensureEmitter().emit(event.type, event);
  const listeners = ensureListenerMap().get(event.type);
  if (listeners) {
    for (const listener of listeners) {
      listener(event);
    }
  }
}

export function subscribeChatEvent<T extends ChatEvent["type"]>(
  event: T,
  handler: (payload: Extract<ChatEvent, { type: T }>) => void,
) {
  ensureBroadcastChannel();
  ensureEmitter().on(event, handler as any);
  const listeners = ensureListenerMap();
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)?.add(handler as any);
  return () => {
    ensureEmitter().off(event, handler as any);
    listeners.get(event)?.delete(handler as any);
  };
}
