import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@akay.id").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: 'Admin Akay',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPass, 10),
        slug: slugify('Admin Akay'),
        isAdmin: true
      }
    });
  }
  // sample voucher
  const v = await prisma.voucher.findUnique({ where: { code: 'AKAY10' } });
  if (!v) {
    await prisma.voucher.create({ data: { code: 'AKAY10', kind: 'PERCENT', value: 10, minSpend: 100000, active: true } });
  }
  return NextResponse.json({ ok: true });
}
