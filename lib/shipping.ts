import { prisma } from "@/lib/prisma";

export type CourierKey = string;

export type CourierConfig = {
  label: string;
  fallbackCost: number;
  rajaOngkir: {
    courier: string;
    service: string;
  };
};

type CourierRecord = {
  key: string;
  label: string;
  fallbackCost: number;
  rajaOngkirCourier: string;
  rajaOngkirService: string;
};

const FALLBACK_COURIERS: Record<CourierKey, CourierConfig> = {
  JNE_REG: {
    label: "JNE Reguler",
    fallbackCost: 20000,
    rajaOngkir: { courier: "jne", service: "REG" },
  },
  JNT_REG: {
    label: "J&T Reguler",
    fallbackCost: 22000,
    rajaOngkir: { courier: "jnt", service: "EZ" },
  },
  SICEPAT_REG: {
    label: "SiCepat Reguler",
    fallbackCost: 21000,
    rajaOngkir: { courier: "sicepat", service: "REG" },
  },
};

export function normalizeCourierKey(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
}

function buildCourierMap(records: CourierRecord[]): Record<CourierKey, CourierConfig> {
  if (records.length === 0) {
    return { ...FALLBACK_COURIERS };
  }

  return records.reduce<Record<CourierKey, CourierConfig>>((acc, record) => {
    const key = normalizeCourierKey(record.key);
    acc[key] = {
      label: record.label,
      fallbackCost: record.fallbackCost,
      rajaOngkir: {
        courier: record.rajaOngkirCourier,
        service: record.rajaOngkirService,
      },
    };
    return acc;
  }, {});
}

export async function getCourierMap(): Promise<Record<CourierKey, CourierConfig>> {
  const couriers = await prisma.courier.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      key: true,
      label: true,
      fallbackCost: true,
      rajaOngkirCourier: true,
      rajaOngkirService: true,
    },
  });

  return buildCourierMap(couriers);
}

export async function getCourierConfig(key: string) {
  const couriers = await getCourierMap();
  const normalized = normalizeCourierKey(key);
  return couriers[normalized];
}

export async function getDefaultCourierKey() {
  const couriers = await getCourierMap();
  const keys = Object.keys(couriers);
  if (keys.length > 0) {
    return keys[0];
  }
  return Object.keys(FALLBACK_COURIERS)[0] ?? "JNE_REG";
}

export async function listCouriers() {
  const couriers = await getCourierMap();
  return Object.entries(couriers).map(([key, config]) => ({ key, ...config }));
}

export const DEFAULT_ITEM_WEIGHT_GRAMS = 1000;
