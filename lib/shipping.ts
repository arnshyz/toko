export type CourierKey = 'JNE_REG' | 'JNT_REG' | 'SICEPAT_REG';
export const COURIERS: Record<CourierKey, { label: string; cost: number }> = {
  JNE_REG: { label: 'JNE Reguler', cost: 20000 },
  JNT_REG: { label: 'J&T Reguler', cost: 22000 },
  SICEPAT_REG: { label: 'SiCepat Reguler', cost: 21000 },
};
