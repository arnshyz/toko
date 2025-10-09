import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);

  const codeRaw = typeof payload?.code === "string" ? payload.code.trim().toUpperCase() : "";
  const itemsTotalRaw = Number(payload?.itemsTotal);
  const itemsTotal = Number.isFinite(itemsTotalRaw) ? Math.max(0, Math.floor(itemsTotalRaw)) : 0;

  if (!codeRaw) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "Masukkan kode voucher untuk mengecek potongan.",
    });
  }

  const voucher = await prisma.voucher.findUnique({ where: { code: codeRaw } });

  if (!voucher || !voucher.active) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "Kode voucher tidak ditemukan atau sedang tidak aktif.",
    });
  }

  if (voucher.expiresAt && voucher.expiresAt <= new Date()) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "Voucher ini sudah kedaluwarsa.",
    });
  }

  if (itemsTotal < voucher.minSpend) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: `Minimal belanja Rp ${new Intl.NumberFormat("id-ID").format(voucher.minSpend)} untuk memakai voucher ini.`,
    });
  }

  let discount = 0;
  if (voucher.kind === "PERCENT") {
    discount = Math.floor(itemsTotal * (voucher.value / 100));
  } else {
    discount = Math.min(itemsTotal, voucher.value);
  }

  return NextResponse.json({
    valid: true,
    discount,
    message: `Voucher ${voucher.code}: hemat Rp ${new Intl.NumberFormat("id-ID").format(discount)}.`,
  });
}
