declare module "ws" {
  import { EventEmitter } from "events";
  import type { IncomingMessage } from "http";
  import type { Socket } from "net";

  export type RawData = Buffer | ArrayBuffer | Buffer[];

  export interface WebSocket extends EventEmitter {
    readonly readyState: number;
    ping(data?: RawData, cb?: (err?: Error) => void): void;
    send(data: RawData | string, cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    on(event: "message", listener: (data: RawData, isBinary: boolean) => void): this;
    on(event: "close", listener: (code: number, reason: Buffer) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "ping" | "pong" | "open", listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
  }

  export interface WebSocketServerOptions {
    noServer?: boolean;
    server?: any;
  }

  export class Server extends EventEmitter {
    constructor(options?: WebSocketServerOptions);
    handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer, callback: (socket: WebSocket) => void): void;
    on(event: "connection", listener: (socket: WebSocket, request: IncomingMessage, ...args: any[]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }

  export { Server as WebSocketServer };
  export default class WebSocketImpl extends EventEmitter implements WebSocket {
    readonly readyState: number;
    ping(data?: RawData, cb?: (err?: Error) => void): void;
    send(data: RawData | string, cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    on(event: "message", listener: (data: RawData, isBinary: boolean) => void): this;
    on(event: "close", listener: (code: number, reason: Buffer) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "ping" | "pong" | "open", listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
  }
}
