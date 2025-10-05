import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { listMessages, sendMessage } from "@/lib/chat/service";
import { setTyping } from "@/lib/chat/presence";

const listSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});

const typingSchema = z.object({ typing: z.boolean().optional() });

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = listSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const messages = await listMessages(params.threadId, session.user.id, parsed.data.take, parsed.data.cursor);
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if ("typing" in body) {
    const parsedTyping = typingSchema.safeParse(body);
    if (!parsedTyping.success) {
      return NextResponse.json({ error: parsedTyping.error.flatten() }, { status: 400 });
    }
    if (parsedTyping.data.typing) {
      await setTyping(params.threadId, session.user.id);
    }
    return NextResponse.json({ ok: true });
  }

  try {
    const message = await sendMessage(params.threadId, session.user.id, body);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
