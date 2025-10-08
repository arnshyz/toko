import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { normalizeCourierKey } from "@/lib/shipping";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const label = String(formData.get("label") || "").trim();
  const keyInput = String(formData.get("key") || "").trim();
  const fallbackCostRaw = String(formData.get("fallbackCost") || "").trim();
  const courierCode = String(formData.get("rajaOngkirCourier") || "").trim();
  const serviceCode = String(formData.get("rajaOngkirService") || "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") || "").trim();

  if (!label) {
    return NextResponse.redirect(new URL(`/admin/couriers?error=${encodeURIComponent("Nama kurir wajib diisi")}`, req.url));
  }

  if (!courierCode || !serviceCode) {
    return NextResponse.redirect(
      new URL(`/admin/couriers?error=${encodeURIComponent("Kode RajaOngkir dan layanan wajib diisi")}`, req.url),
    );
  }

  const fallbackCost = Number.parseInt(fallbackCostRaw, 10);
  if (!Number.isFinite(fallbackCost) || fallbackCost < 0) {
    return NextResponse.redirect(new URL(`/admin/couriers?error=${encodeURIComponent("Tarif cadangan tidak valid")}`, req.url));
  }

  const sortOrder = Number.parseInt(sortOrderRaw, 10);
  const finalSortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
  const normalizedKey = keyInput ? normalizeCourierKey(keyInput) : normalizeCourierKey(label.replace(/\s+/g, "_"));

  try {
    await prisma.courier.create({
      data: {
        key: normalizedKey,
        label,
        fallbackCost,
        rajaOngkirCourier: courierCode.toLowerCase(),
        rajaOngkirService: serviceCode.toUpperCase(),
        sortOrder: finalSortOrder,
        isActive: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan kurir";
    return NextResponse.redirect(new URL(`/admin/couriers?error=${encodeURIComponent(message)}`, req.url));
  }

  return NextResponse.redirect(new URL(`/admin/couriers?message=${encodeURIComponent("Kurir berhasil ditambahkan")}`, req.url));
}
