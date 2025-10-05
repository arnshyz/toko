import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createThread, listThreads } from "@/lib/chat/service";
import { ChatContextType, ChatParticipantRole, ChatThreadType } from "@prisma/client";

const listSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
});

const createSchema = z.object({
  contextType: z.nativeEnum(ChatContextType),
  contextId: z.string().min(1),
  title: z.string().optional(),
  type: z.nativeEnum(ChatThreadType).optional(),
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.nativeEnum(ChatParticipantRole).optional(),
      }),
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = listSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 400 });
  }

  const threads = await listThreads(session.user.id, query.data.take, query.data.cursor);
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const thread = await createThread({ ...parsed.data, creatorId: session.user.id });
  return NextResponse.json({ thread }, { status: 201 });
}
