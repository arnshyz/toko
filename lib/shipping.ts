export type CourierKey = 'JNE_REG' | 'JNT_REG' | 'SICEPAT_REG';

export type CourierConfig = {
  label: string;
  /**
   * Used when RajaOngkir cost lookup fails so checkout still works.
   */
  fallbackCost: number;
  rajaOngkir: {
    /** RajaOngkir courier code */
    courier: string;
    /** RajaOngkir service code */
    service: string;
  };
};

export const COURIERS: Record<CourierKey, CourierConfig> = {
  JNE_REG: {
    label: 'JNE Reguler',
    fallbackCost: 20000,
    rajaOngkir: { courier: 'jne', service: 'REG' },
  },
  JNT_REG: {
    label: 'J&T Reguler',
    fallbackCost: 22000,
    rajaOngkir: { courier: 'jnt', service: 'EZ' },
  },
  SICEPAT_REG: {
    label: 'SiCepat Reguler',
    fallbackCost: 21000,
    rajaOngkir: { courier: 'sicepat', service: 'REG' },
  },
};

/**
 * Rough default weight per item (grams) when product weight is unknown.
 * RajaOngkir Starter supports maximum 30.000 gram per request.
 */
export const DEFAULT_ITEM_WEIGHT_GRAMS = 1000;
