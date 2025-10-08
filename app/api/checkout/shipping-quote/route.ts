import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DEFAULT_ITEM_WEIGHT_GRAMS, getCourierMap, normalizeCourierKey } from "@/lib/shipping";
import { calculateShippingCost } from "@/lib/shipping-cost";

type QuoteItem = { productId: string; qty: number };

type ParsedPayload = {
  items: QuoteItem[];
  courier: string;
};

function sanitizePayload(raw: unknown): ParsedPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as { items?: unknown; courier?: unknown };
  const courierKey = typeof value.courier === "string" ? value.courier : "";

  if (!Array.isArray(value.items)) {
    return null;
  }

  const items: QuoteItem[] = [];

  for (const entry of value.items) {
    if (!entry || typeof entry !== "object") continue;

    const { productId, qty } = entry as QuoteItem;
    if (typeof productId !== "string" || !productId.trim()) continue;

    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    items.push({ productId, qty: Math.floor(quantity) });
  }

  if (items.length === 0) {
    return null;
  }

  return { items, courier: courierKey };
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const viewer = session.user;

  if (!viewer) {
    return NextResponse.json({ error: "Silakan masuk untuk menghitung ongkir." }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const parsed = sanitizePayload(payload);

  if (!parsed) {
    return NextResponse.json({ error: "Data keranjang atau kurir tidak valid." }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.items.map((item) => item.productId) } },
    include: {
      warehouse: {
        select: {
          id: true,
          city: true,
        },
      },
    },
  });

  if (products.length === 0) {
    return NextResponse.json({ error: "Produk untuk dihitung ongkir tidak ditemukan." }, { status: 400 });
  }

  const shipmentsMap = new Map<
    string,
    { originCityName: string | null; originCityId: string | null; weight: number }
  >();

  const defaultOriginCityName = process.env.RAJAONGKIR_DEFAULT_ORIGIN_CITY?.trim() || null;
  const defaultOriginCityId = process.env.RAJAONGKIR_DEFAULT_ORIGIN_CITY_ID?.trim() || null;

  for (const item of parsed.items) {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) {
      return NextResponse.json({ error: "Beberapa produk tidak tersedia lagi." }, { status: 400 });
    }

    const shipmentKey = product.warehouseId ?? "default";
    const existing =
      shipmentsMap.get(shipmentKey) ?? {
        originCityName: null as string | null,
        originCityId: null as string | null,
        weight: 0,
      };

    if (!existing.originCityName) {
      const warehouseCity = product.warehouse?.city?.trim();
      if (warehouseCity) {
        existing.originCityName = warehouseCity;
      } else if (defaultOriginCityName) {
        existing.originCityName = defaultOriginCityName;
      }
    }

    if (!existing.originCityId && !product.warehouse?.city && defaultOriginCityId) {
      existing.originCityId = defaultOriginCityId;
    }

    const quantity = Math.max(1, Number.isFinite(item.qty) ? item.qty : 1);
    existing.weight += quantity * DEFAULT_ITEM_WEIGHT_GRAMS;

    shipmentsMap.set(shipmentKey, existing);
  }

  if (shipmentsMap.size === 0) {
    return NextResponse.json({ error: "Tidak ada pengiriman yang perlu dihitung." }, { status: 400 });
  }

  const account = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: {
      addresses: {
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          city: true,
          province: true,
        },
      },
    },
  });

  if (!account || account.addresses.length === 0) {
    return NextResponse.json(
      { error: "Silakan tambahkan alamat pengiriman di Akun Saya terlebih dahulu." },
      { status: 400 },
    );
  }

  const defaultAddress = account.addresses[0];

  const courierMap = await getCourierMap();
  const courierKeys = Object.keys(courierMap);
  if (!courierKeys.length) {
    return NextResponse.json({ error: "Kurir belum dikonfigurasi." }, { status: 500 });
  }

  const requestedKey = normalizeCourierKey(parsed.courier);
  const courierKey = requestedKey && courierMap[requestedKey] ? requestedKey : courierKeys[0]!;
  const courier = courierMap[courierKey];

  const calculation = await calculateShippingCost({
    shipments: Array.from(shipmentsMap.values()),
    courier,
    destinationCity: defaultAddress.city,
    destinationProvince: defaultAddress.province,
    fallbackOrigin: {
      cityId: defaultOriginCityId,
      cityName: defaultOriginCityName,
    },
  });

  if (calculation.usedFallback && calculation.debugError) {
    console.error("Failed to calculate RajaOngkir shipping quote", calculation.debugError);
  }

  return NextResponse.json({
    cost: calculation.cost,
    usedFallback: calculation.usedFallback,
    reason: calculation.failureReason ?? null,
  });
}
