const RAJA_ONGKIR_BASE_URL = "https://api.rajaongkir.com/starter";

type RajaOngkirCityResponse = {
  rajaongkir?: {
    results?: {
      postal_code?: string;
    };
    status?: {
      code?: number;
      description?: string;
    };
  };
};

export async function fetchCityPostalCode(cityId: string): Promise<string | null> {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey || !cityId) {
    return null;
  }

  const url = `${RAJA_ONGKIR_BASE_URL}/city?id=${encodeURIComponent(cityId)}`;

  try {
    const res = await fetch(url, {
      headers: {
        key: apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Failed to fetch postal code from RajaOngkir", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = (await res.json()) as RajaOngkirCityResponse;
    const postalCode = data?.rajaongkir?.results?.postal_code;
    return postalCode && postalCode.trim().length > 0 ? postalCode.trim() : null;
  } catch (error) {
    console.warn("Error fetching postal code from RajaOngkir", error);
    return null;
  }
}
