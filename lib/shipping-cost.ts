import { fetchRajaOngkirCost, findCityIdByName } from "./rajaongkir";
import { CourierConfig, DEFAULT_ITEM_WEIGHT_GRAMS } from "./shipping";

export type ShipmentInput = {
  originCityId: string | null;
  originCityName: string | null;
  weight: number;
};

export type ShippingCostResult = {
  cost: number;
  usedFallback: boolean;
  failureReason?: string;
  destinationCityId: string | null;
  debugError?: unknown;
};

type CalculateShippingCostParams = {
  shipments: ShipmentInput[];
  courier: CourierConfig;
  destinationCity: string | null | undefined;
  destinationProvince?: string | null | undefined;
};

export async function calculateShippingCost({
  shipments,
  courier,
  destinationCity,
  destinationProvince,
}: CalculateShippingCostParams): Promise<ShippingCostResult> {
  const shipmentCount = Math.max(1, shipments.length || 0);
  const fallbackCost = courier.fallbackCost * shipmentCount;

  if (!shipments.length) {
    return {
      cost: fallbackCost,
      usedFallback: true,
      failureReason: "Tidak ada pengiriman yang perlu dihitung.",
      destinationCityId: null,
    };
  }

  const destinationCityId = await findCityIdByName({
    cityName: destinationCity,
    provinceName: destinationProvince ?? null,
  });

  if (!destinationCityId) {
    return {
      cost: fallbackCost,
      usedFallback: true,
      failureReason: "Kota tujuan tidak dikenali oleh RajaOngkir.",
      destinationCityId: null,
    };
  }

  let totalCost = 0;

  for (const shipment of shipments) {
    let originCityId = shipment.originCityId;

    if (!originCityId && shipment.originCityName) {
      originCityId = await findCityIdByName({ cityName: shipment.originCityName });
    }

    if (!originCityId) {
      return {
        cost: fallbackCost,
        usedFallback: true,
        failureReason:
          "Gudang produk belum memiliki kota asal yang valid untuk perhitungan RajaOngkir.",
        destinationCityId,
      };
    }

    try {
      const costResults = await fetchRajaOngkirCost({
        origin: originCityId,
        destination: destinationCityId,
        weight: shipment.weight || DEFAULT_ITEM_WEIGHT_GRAMS,
        courier: courier.rajaOngkir.courier,
      });

      const courierResult = costResults.find(
        (result) => result.code.toLowerCase() === courier.rajaOngkir.courier.toLowerCase(),
      );

      const service = courierResult?.costs.find(
        (option) => option.service.toUpperCase() === courier.rajaOngkir.service,
      );

      const firstCost = service?.cost?.[0]?.value;

      if (typeof firstCost !== "number" || Number.isNaN(firstCost)) {
        return {
          cost: fallbackCost,
          usedFallback: true,
          failureReason: "RajaOngkir tidak mengembalikan tarif untuk layanan yang dipilih.",
          destinationCityId,
        };
      }

      totalCost += firstCost;
    } catch (error) {
      return {
        cost: fallbackCost,
        usedFallback: true,
        failureReason: "Terjadi kesalahan saat menghitung ongkir otomatis.",
        destinationCityId,
        debugError: error,
      };
    }
  }

  return {
    cost: totalCost,
    usedFallback: false,
    destinationCityId,
  };
}
