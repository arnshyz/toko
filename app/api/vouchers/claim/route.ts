import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return NextResponse.json({ error: "Silakan masuk untuk klaim voucher." }, { status: 401 });
  }

  let payload: { voucherId?: string; voucherCode?: string } | null = null;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Data permintaan tidak valid." }, { status: 400 });
  }

  const identifier = payload?.voucherId?.trim() || payload?.voucherCode?.trim();
  if (!identifier) {
    return NextResponse.json({ error: "Voucher tidak ditemukan." }, { status: 400 });
  }

  const voucher = await prisma.voucher.findFirst({
    where: {
      OR: [
        { id: identifier },
        { code: identifier.toUpperCase() },
      ],
    },
  });

  if (!voucher) {
    return NextResponse.json({ error: "Voucher tidak tersedia." }, { status: 404 });
  }

  if (!voucher.active) {
    return NextResponse.json({ error: "Voucher sudah tidak aktif." }, { status: 400 });
  }

  if (voucher.expiresAt && voucher.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Voucher telah kedaluwarsa." }, { status: 400 });
  }

  const claimed = await prisma.userVoucher.upsert({
    where: {
      userId_voucherId: {
        userId: user.id,
        voucherId: voucher.id,
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      userId: user.id,
      voucherId: voucher.id,
    },
    include: {
      voucher: true,
    },
  });

  return NextResponse.json({
    ok: true,
    claimedAt: claimed.claimedAt,
    voucher: {
      id: claimed.voucher.id,
      code: claimed.voucher.code,
      kind: claimed.voucher.kind,
      value: claimed.voucher.value,
      minSpend: claimed.voucher.minSpend,
      expiresAt: claimed.voucher.expiresAt,
    },
  });
}
