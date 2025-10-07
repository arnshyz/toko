import { NextResponse } from "next/server";

import { fetchRajaOngkir, RajaOngkirError } from "@/lib/rajaongkir";

type ProvinceResult = {
  province_id: string;
  province: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await fetchRajaOngkir<ProvinceResult[]>("province");
    const provinces = results
      .filter((province) => province?.province_id && province?.province)
      .map((province) => ({
        id: province.province_id,
        name: province.province.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(provinces);
  } catch (error) {
    if (error instanceof RajaOngkirError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode >= 400 ? error.statusCode : 502 },
      );
    }

    console.error("Failed to load provinces from RajaOngkir", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar provinsi." },
      { status: 500 },
    );
  }
}
