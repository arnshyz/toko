import type { NextApiRequest, NextApiResponse } from "next";
import type { Server } from "http";
import { ServerResponse } from "http";
import { Server as WebSocketServer, type WebSocket } from "ws";
import { sessionOptions, type SessionData } from "@/lib/session";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { markOffline, markOnline, setTyping } from "@/lib/chat/presence";
import { publishChatEvent, subscribeChatEvent } from "@/lib/chat/events";
import type { ChatEvent } from "@/types/chat";
import { MessageDeliveryStatus } from "@prisma/client";

interface SocketServer extends Server {
  chatWss?: WebSocketServer;
}

interface SocketWithMeta extends WebSocket {
  threadId?: string;
  userId?: string;
  participantId?: string;
  heartbeat?: NodeJS.Timeout;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function getServer(res: NextApiResponse): SocketServer {
  const socket = res.socket;
  if (!socket) {
    throw new Error("WebSocket upgrade socket is not available on the response");
  }
  return socket.server as SocketServer;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const server = getServer(res);
  if (!server.chatWss) {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", async (request, socket, head) => {
      const { url, headers } = request;
      if (!url || !url.startsWith("/api/chat/socket")) {
        return;
      }
      const response = new ServerResponse(request);
      const session = await getIronSession<SessionData>(request, response, sessionOptions);
      if (!session.user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const origin = `http://${headers.host ?? "localhost"}`;
      const parsedUrl = new URL(url, origin);
      const threadId = parsedUrl.searchParams.get("threadId");
      if (!threadId) {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\nthreadId required");
        socket.destroy();
        return;
      }

      const participant = await prisma.chatParticipant.findFirst({
        where: { threadId, userId: session.user.id },
      });
      if (!participant) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\nnot a participant");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const typedWs = ws as SocketWithMeta;
        typedWs.threadId = threadId;
        typedWs.userId = session.user!.id;
        typedWs.participantId = participant.id;
        wss.emit("connection", typedWs, request, session);
      });
    });

    wss.on("connection", async (socket: SocketWithMeta) => {
      if (!socket.threadId || !socket.userId || !socket.participantId) {
        socket.close(1008, "metadata missing");
        return;
      }

      await markOnline(socket.threadId, socket.userId);
      publishChatEvent({
        type: "participant.presence",
        threadId: socket.threadId,
        userId: socket.userId,
        status: "online",
      });

      const subscriptions = [
        subscribeChatEvent("message.created", (event) => {
          if (event.threadId === socket.threadId) {
            socket.send(JSON.stringify(event));
          }
        }),
        subscribeChatEvent("thread.updated", (event) => {
          if (event.thread.id === socket.threadId) {
            socket.send(JSON.stringify(event));
          }
        }),
        subscribeChatEvent("message.receipt", (event) => {
          if (event.threadId === socket.threadId) {
            socket.send(JSON.stringify(event));
          }
        }),
        subscribeChatEvent("participant.typing", (event) => {
          if (event.threadId === socket.threadId && event.userId !== socket.userId) {
            socket.send(JSON.stringify(event));
          }
        }),
        subscribeChatEvent("participant.presence", (event) => {
          if (event.threadId === socket.threadId && event.userId !== socket.userId) {
            socket.send(JSON.stringify(event));
          }
        }),
      ];

      const heartbeat = () => {
        socket.ping();
        socket.heartbeat = setTimeout(heartbeat, 30000);
      };
      heartbeat();

      socket.on("message", async (raw) => {
        try {
          const payload = JSON.parse(raw.toString()) as Partial<ChatEvent> & { type: string };
          if (payload.type === "ping") {
            socket.send(JSON.stringify({ type: "pong" }));
            return;
          }
          if (payload.type === "typing") {
            await setTyping(socket.threadId!, socket.userId!);
            publishChatEvent({
              type: "participant.typing",
              threadId: socket.threadId!,
              userId: socket.userId!,
              expiresAt: Date.now() + 10_000,
            });
            return;
          }
          if (payload.type === "receipt" && payload.messageId && payload.status) {
            publishChatEvent({
              type: "message.receipt",
              threadId: socket.threadId!,
              messageId: payload.messageId as string,
              status: payload.status as MessageDeliveryStatus,
              userId: socket.userId!,
            });
          }
        } catch (error) {
          socket.send(JSON.stringify({ type: "error", message: (error as Error).message }));
        }
      });

      socket.on("close", async () => {
        subscriptions.forEach((unsubscribe) => unsubscribe());
        if (socket.heartbeat) {
          clearTimeout(socket.heartbeat);
        }
        if (socket.threadId && socket.userId) {
          await markOffline(socket.threadId, socket.userId);
          publishChatEvent({
            type: "participant.presence",
            threadId: socket.threadId,
            userId: socket.userId,
            status: "offline",
          });
        }
      });

      socket.on("error", () => {
        socket.close();
      });
    });

    server.chatWss = wss;
  }

  res.status(200).end();
}
