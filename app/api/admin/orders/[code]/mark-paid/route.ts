import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { sendPaymentSuccessEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const res = new NextResponse();


  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;
  if (!user || !user.isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const order = await prisma.order.update({ where: { orderCode: params.code }, data: { status: "PAID" } });
  await prisma.verificationLog.create({ data: { orderId: order.id, actor: `admin:${user.email}`, action: "mark_paid" } });

  if (order.buyerEmail) {
    try {
      await sendPaymentSuccessEmail({
        email: order.buyerEmail,
        name: order.buyerName,
        orderCode: order.orderCode,
      });
    } catch (error) {
      console.error("Failed to send payment success email", error);
    }
  }

  // selesai → redirect ke halaman admin
  return NextResponse.redirect(new URL("/admin/orders", req.url));
}
