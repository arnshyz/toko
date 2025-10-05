import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hydrateThread } from "@/lib/chat/utils";

const schema = z.object({
  q: z.string().min(1),
  cursor: z.string().optional(),
  take: z.coerce.number().int().positive().max(20).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!params.success) {
    return NextResponse.json({ error: params.error.flatten() }, { status: 400 });
  }

  const { q, cursor, take } = params.data;
  const threads = await prisma.chatThread.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        {
          messages: {
            some: {
              content: { contains: q, mode: "insensitive" },
            },
          },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: take ?? 10,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { participants: true, lastMessage: { include: { attachments: true } } },
  });

  return NextResponse.json({ threads: threads.map(hydrateThread) });
}
