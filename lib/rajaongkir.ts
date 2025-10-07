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
