import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { sendOrderCancelledEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const res = new NextResponse();

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;
  if (!user || !user.isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const form = await req.formData();
  const reasonRaw = form.get("reason");
  const reason = typeof reasonRaw === "string" && reasonRaw.trim() ? reasonRaw.trim() : null;

  const order = await prisma.order.update({ where: { orderCode: params.code }, data: { status: "CANCELLED" } });
  await prisma.verificationLog.create({
    data: {
      orderId: order.id,
      actor: `admin:${user.email}`,
      action: "cancel_order",
      note: reason ?? undefined,
    },
  });

  if (order.buyerEmail) {
    try {
      await sendOrderCancelledEmail({
        email: order.buyerEmail,
        name: order.buyerName,
        orderCode: order.orderCode,
        reason,
      });
    } catch (error) {
      console.error("Failed to send order cancelled email", error);
    }
  }

  return NextResponse.redirect(new URL("/admin/orders", req.url));
}
