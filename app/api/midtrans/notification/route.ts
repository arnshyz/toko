import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
    payment_type: paymentType,
    transaction_id: transactionId,
    fraud_status: fraudStatus,
  } = body || {};

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
  }

  if (!verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  })) {
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  const gatewayStatus = String(transactionStatus || "pending").toLowerCase();

  let newStatus: "PENDING" | "PAID" | "CANCELLED" = "PENDING";
  if (gatewayStatus === "capture") {
    newStatus = fraudStatus === "challenge" ? "PENDING" : "PAID";
  } else if (gatewayStatus === "settlement") {
    newStatus = "PAID";
  } else if (["cancel", "deny", "expire"].includes(gatewayStatus)) {
    newStatus = "CANCELLED";
  } else if (gatewayStatus === "pending") {
    newStatus = "PENDING";
  }

  const order = await prisma.order.findUnique({ where: { orderCode: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  await prisma.order.update({
    where: { orderCode: orderId },
    data: {
      status: newStatus,
      midtransStatus: gatewayStatus,
      midtransPaymentType: paymentType ?? null,
      midtransTransactionId: transactionId ?? null,
    } as any,
  });

  const actor = "midtrans:webhook";
  const action = newStatus === "PAID" ? "payment_settled" : `status_${gatewayStatus}`;
  const noteParts = [paymentType, fraudStatus && `fraud:${fraudStatus}`].filter(Boolean);

  await prisma.verificationLog.create({
    data: {
      orderId: order.id,
      actor,
      action,
      note: noteParts.length ? noteParts.join(" | ") : undefined,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
