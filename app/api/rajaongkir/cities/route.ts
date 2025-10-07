import { NextResponse } from "next/server";

import { fetchRajaOngkir, RajaOngkirError } from "@/lib/rajaongkir";
import { getStaticCitiesByProvince } from "@/lib/staticCities";

type CityResult = {
  city_id: string;
  city_name: string;
  type: string;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("province");

  if (!provinceId) {
    return NextResponse.json(
      { error: "Parameter province wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const results = await fetchRajaOngkir<CityResult[]>("city", {
      province: provinceId,
    });

    const cities = results
      .filter((city) => city?.city_id && city?.city_name)
      .map((city) => ({
        id: city.city_id,
        name: city.city_name.trim(),
        type: city.type.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(cities);
  } catch (error) {
    const staticCities = getStaticCitiesByProvince(provinceId);

    if (staticCities.length > 0) {
      if (error instanceof RajaOngkirError) {
        console.warn(
          `Falling back to static city catalog for province ${provinceId}: ${error.message}`,
        );
      } else {
        console.error("Failed to load cities from RajaOngkir", error);
        console.warn(`Falling back to static city catalog for province ${provinceId}.`);
      }

      return NextResponse.json(
        staticCities
          .map((city) => ({
            id: city.id,
            name: city.name,
            type: city.type,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    if (error instanceof RajaOngkirError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode >= 400 ? error.statusCode : 502 },
      );
    }

    console.error("Failed to load cities from RajaOngkir", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kota." },
      { status: 500 },
    );
  }
}
