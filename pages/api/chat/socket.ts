// pages/api/chat/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";

type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & { io?: IOServer };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    res.socket.server.io = new IOServer(res.socket.server, {
      path: "/api/chat/socket",
      addTrailingSlash: false,
    });
  }
  res.end();
}
