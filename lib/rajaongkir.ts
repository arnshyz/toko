const DEFAULT_BASE_URL = "https://api.rajaongkir.com/starter/";

export class RajaOngkirError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RajaOngkirError";
    this.statusCode = statusCode;
  }
}

function getApiKey(): string {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) {
    throw new RajaOngkirError(
      "RAJAONGKIR_API_KEY is not configured in the environment.",
      500,
    );
  }
  return key;
}

function getBaseUrl(): string {
  const base = process.env.RAJAONGKIR_API_BASE_URL?.trim();
  if (!base) {
    return DEFAULT_BASE_URL;
  }
  try {
    const normalized = new URL(base);
    if (!normalized.pathname.endsWith("/")) {
      normalized.pathname = `${normalized.pathname}/`;
    }
    return normalized.toString();
  } catch {
    return DEFAULT_BASE_URL;
  }
}

type RajaOngkirStatus = {
  code: number;
  description: string;
};

type RajaOngkirResponse<T> = {
  rajaongkir?: {
    status?: RajaOngkirStatus;
    results?: T;
  };
};

export type RajaOngkirProvince = {
  province_id: string;
  province: string;
};

export type RajaOngkirCity = {
  city_id: string;
  city_name: string;
  type: string;
  province_id: string;
  province: string;
  postal_code: string;
};

export type RajaOngkirCostResult = {
  code: string;
  name: string;
  costs: {
    service: string;
    description: string;
    cost: { value: number; etd: string; note: string }[];
  }[];
};

function normalizeRegion(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCity(value: string) {
  return normalizeRegion(value)
    .replace(/^(kota|kabupaten|kab|kodya|kotamadya)\s+/g, "")
    .replace(/^administrasi\s+/g, "")
    .trim();
}

let cachedCities: RajaOngkirCity[] | null = null;

export async function fetchRajaOngkir<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = new URL(endpoint.replace(/^\//, ""), baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    ...init,
    method: "GET",
    headers: {
      key: getApiKey(),
      ...init.headers,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!isJson) {
    if (!response.ok) {
      throw new RajaOngkirError(response.statusText, response.status);
    }
    throw new RajaOngkirError("Unexpected response from RajaOngkir API.", 500);
  }

  const body = (await response.json()) as RajaOngkirResponse<T>;
  const status = body.rajaongkir?.status;
  const results = body.rajaongkir?.results;

  if (!status) {
    throw new RajaOngkirError("Missing status information from RajaOngkir API.", 500);
  }

  if (status.code !== 200) {
    throw new RajaOngkirError(status.description ?? "RajaOngkir API error.", status.code);
  }

  if (results === undefined) {
    throw new RajaOngkirError("Missing results in RajaOngkir API response.", 500);
  }

  return results;
}

async function getAllCities(): Promise<RajaOngkirCity[]> {
  if (!cachedCities) {
    cachedCities = await fetchRajaOngkir<RajaOngkirCity[]>("city");
  }
  return cachedCities;
}

type FindCityIdOptions = {
  cityName: string | null | undefined;
  provinceName?: string | null;
};

export async function findCityIdByName({
  cityName,
  provinceName,
}: FindCityIdOptions): Promise<string | null> {
  if (!cityName) {
    return null;
  }

  const normalizedCity = normalizeCity(cityName);
  const normalizedProvince = provinceName ? normalizeRegion(provinceName) : null;

  if (!normalizedCity) {
    return null;
  }

  const cities = await getAllCities();

  for (const city of cities) {
    if (normalizedProvince && normalizeRegion(city.province) !== normalizedProvince) {
      continue;
    }

    const cityFull = normalizeCity(`${city.type} ${city.city_name}`);
    const cityOnly = normalizeCity(city.city_name);

    if (cityFull === normalizedCity || cityOnly === normalizedCity) {
      return city.city_id;
    }
  }

  return null;
}

type FetchCostParams = {
  origin: string;
  originType?: "city" | "subdistrict";
  destination: string;
  destinationType?: "city" | "subdistrict";
  weight: number;
  courier: string;
};

export async function fetchRajaOngkirCost({
  origin,
  originType = "city",
  destination,
  destinationType = "city",
  weight,
  courier,
}: FetchCostParams): Promise<RajaOngkirCostResult[]> {
  const baseUrl = getBaseUrl();
  const url = new URL("cost", baseUrl);

  const body = new URLSearchParams();
  body.set("origin", origin);
  body.set("originType", originType);
  body.set("destination", destination);
  body.set("destinationType", destinationType);
  body.set("weight", String(Math.max(1, Math.min(30000, Math.round(weight)))));
  body.set("courier", courier);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      key: getApiKey(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!isJson) {
    if (!response.ok) {
      throw new RajaOngkirError(response.statusText, response.status);
    }
    throw new RajaOngkirError("Unexpected response from RajaOngkir API.", 500);
  }

  const bodyJson = (await response.json()) as RajaOngkirResponse<RajaOngkirCostResult[]>;
  const status = bodyJson.rajaongkir?.status;
  const results = bodyJson.rajaongkir?.results;

  if (!status) {
    throw new RajaOngkirError("Missing status information from RajaOngkir API.", 500);
  }

  if (status.code !== 200) {
    throw new RajaOngkirError(status.description ?? "RajaOngkir API error.", status.code);
  }

  if (!Array.isArray(results)) {
    throw new RajaOngkirError("Missing results in RajaOngkir API response.", 500);
  }

  return results;
}
