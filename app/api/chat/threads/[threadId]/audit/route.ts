import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const participant = await prisma.chatParticipant.findFirst({
    where: { threadId: params.threadId, userId: session.user.id },
  });
  if (!participant && !session.user.isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const logs = await prisma.chatAuditLog.findMany({
    where: { threadId: params.threadId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ logs });
}
