import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

async function getOrderByCode(orderCode: string) {
  return prisma.order.findUnique({
    where: { orderCode },
    include: { items: { select: { sellerId: true } } },
  });
}

async function ensureThread(orderId: string) {
  return prisma.chatThread.upsert({
    where: { orderId },
    create: { orderId },
    update: {},
  });
}

function serializeMessages(messages: { id: string; sender: string; content: string | null; createdAt: Date }[]) {
  return messages.map((message) => ({
    id: message.id,
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }));
}

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const order = await getOrderByCode(params.code);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const thread = await ensureThread(order.id);
  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages: serializeMessages(messages) });
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getIronSession<{ user?: SessionUser }>(req, new Response(), sessionOptions);
  const user = session.user;

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
  }

  const order = await getOrderByCode(params.code);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const sellerIds = new Set(order.items.map((item) => item.sellerId));

  let sender: string;
  if (user && sellerIds.has(user.id)) {
    sender = `seller:${user.id}`;
  } else if (user && user.isAdmin) {
    sender = `admin:${user.id}`;
  } else {
    const buyerIdentifier = order.buyerPhone?.trim() || order.buyerName?.trim() || "anonymous";
    sender = `buyer:${buyerIdentifier}`;
  }

  const thread = await ensureThread(order.id);
  const message = await prisma.chatMessage.create({
    data: {
      threadId: thread.id,
      sender,
      content,
    },
  });

  return NextResponse.json({ message: serializeMessages([message])[0] });
}
