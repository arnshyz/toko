import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPresence, isTyping } from "@/lib/chat/presence";

export async function GET(
  _req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const participants = await prisma.chatParticipant.findMany({
    where: { threadId: params.threadId },
  });
  if (!participants.some((p) => p.userId === session.user.id)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const statuses = await Promise.all(
    participants.map(async (participant) => ({
      userId: participant.userId,
      presence: await getPresence(params.threadId, participant.userId),
      typing: await isTyping(params.threadId, participant.userId),
    })),
  );
  return NextResponse.json({ participants: statuses });
}
