import { NextResponse } from "next/server";

import { fetchRajaOngkir, RajaOngkirError } from "@/lib/rajaongkir";

type SubdistrictResult = {
  subdistrict_id: string;
  subdistrict_name: string;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("city");

  if (!cityId) {
    return NextResponse.json(
      { error: "Parameter city wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const results = await fetchRajaOngkir<SubdistrictResult[]>("subdistrict", {
      city: cityId,
    });

    const subdistricts = results
      .filter((subdistrict) => subdistrict?.subdistrict_id && subdistrict?.subdistrict_name)
      .map((subdistrict) => ({
        id: subdistrict.subdistrict_id,
        name: subdistrict.subdistrict_name.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(subdistricts);
  } catch (error) {
    if (error instanceof RajaOngkirError) {
      if (error.statusCode === 400 || error.statusCode === 403) {
        return NextResponse.json(
          { error: error.message },
          { status: 501 },
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode >= 400 ? error.statusCode : 502 },
      );
    }

    console.error("Failed to load subdistricts from RajaOngkir", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kecamatan." },
      { status: 500 },
    );
  }
}
