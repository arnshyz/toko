import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { VoucherKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";

export const runtime = "nodejs";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Tanggal kedaluwarsa tidak valid");
  }
  return parsed;
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const form = await req.formData();

  const codeRaw = form.get("code");
  const kindRaw = form.get("kind");
  const valueRaw = form.get("value");
  const minSpendRaw = form.get("minSpend");

  try {
    if (typeof codeRaw !== "string" || codeRaw.trim().length === 0) {
      throw new Error("Kode voucher wajib diisi");
    }
    const code = codeRaw.trim().toUpperCase();

    if (typeof kindRaw !== "string" || !Object.values(VoucherKind).includes(kindRaw as VoucherKind)) {
      throw new Error("Jenis voucher tidak valid");
    }
    const kind = kindRaw as VoucherKind;

    const value = Number.parseInt(String(valueRaw ?? ""), 10);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Nilai voucher harus berupa angka positif");
    }
    if (kind === "PERCENT" && (value < 1 || value > 100)) {
      throw new Error("Nilai persentase harus antara 1 hingga 100");
    }

    const minSpend = Number.parseInt(String(minSpendRaw ?? "0"), 10);
    if (!Number.isFinite(minSpend) || minSpend < 0) {
      throw new Error("Minimal belanja tidak valid");
    }

    const expiresAt = parseDate(form.get("expiresAt"));
    const active = parseBoolean(form.get("active"));

    await prisma.voucher.create({
      data: {
        code,
        kind,
        value,
        minSpend,
        expiresAt,
        active,
      },
    });

    const redirectUrl = new URL("/admin/vouchers", req.url);
    redirectUrl.searchParams.set("message", "Voucher baru berhasil dibuat");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat membuat voucher";
    const redirectUrl = new URL("/admin/vouchers", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
