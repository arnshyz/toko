import { NextResponse } from "next/server";

import { listCouriers } from "@/lib/shipping";

export async function GET() {
  try {
    const couriers = await listCouriers();
    if (!couriers.length) {
      return NextResponse.json({ couriers: [], defaultKey: null });
    }

    return NextResponse.json({ couriers, defaultKey: couriers[0]!.key });
  } catch (error) {
    console.error("Failed to load couriers", error);
    return NextResponse.json({ error: "Gagal memuat daftar kurir." }, { status: 500 });
  }
}
