"use client";

import { useEffect, useMemo, useState } from "react";

type RegionOption = { id: string; name: string };

type FetchState = {
  loading: boolean;
  error: string | null;
};

async function fetchRegions(url: string): Promise<RegionOption[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Gagal memuat data wilayah (${res.status})`);
  }
  const data = (await res.json()) as { id: string; name: string }[];
  if (!Array.isArray(data)) {
    throw new Error("Data wilayah tidak valid");
  }
  return data.map((entry) => ({ id: String(entry.id), name: entry.name }));
}

export function AddressSelectors() {
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);

  const [provinceState, setProvinceState] = useState<FetchState>({ loading: true, error: null });
  const [cityState, setCityState] = useState<FetchState>({ loading: false, error: null });
  const [districtState, setDistrictState] = useState<FetchState>({ loading: false, error: null });

  const [provinceRequestKey, setProvinceRequestKey] = useState(0);
  const [cityRequestKey, setCityRequestKey] = useState(0);
  const [districtRequestKey, setDistrictRequestKey] = useState(0);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  const selectedProvince = useMemo(
    () => provinces.find((option) => option.id === selectedProvinceId) ?? null,
    [provinces, selectedProvinceId],
  );
  const selectedCity = useMemo(
    () => cities.find((option) => option.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );
  const selectedDistrict = useMemo(
    () => districts.find((option) => option.id === selectedDistrictId) ?? null,
    [districts, selectedDistrictId],
  );

  useEffect(() => {
    let cancelled = false;
    setProvinceState({ loading: true, error: null });

    fetchRegions("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json")
      .then((options) => {
        if (!cancelled) {
          setProvinces(options);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Gagal memuat data provinsi.";
          setProvinceState({ loading: false, error: message });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProvinceState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provinceRequestKey]);

  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      setSelectedCityId("");
      setCityState({ loading: false, error: null });
      return;
    }

    let cancelled = false;
    setCityState({ loading: true, error: null });

    fetchRegions(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
      .then((options) => {
        if (!cancelled) {
          setCities(options);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Gagal memuat data kota.";
          setCityState({ loading: false, error: message });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCityState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProvinceId, cityRequestKey]);

  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      setSelectedDistrictId("");
      setDistrictState({ loading: false, error: null });
      return;
    }

    let cancelled = false;
    setDistrictState({ loading: true, error: null });

    fetchRegions(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
      .then((options) => {
        if (!cancelled) {
          setDistricts(options);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Gagal memuat data kecamatan.";
          setDistrictState({ loading: false, error: message });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDistrictState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCityId, districtRequestKey]);

  return (
    <>
      <input type="hidden" name="province" value={selectedProvince?.name ?? ""} />
      <input type="hidden" name="city" value={selectedCity?.name ?? ""} />
      <input type="hidden" name="district" value={selectedDistrict?.name ?? ""} />

      <div className="space-y-1">
        <label htmlFor="provinceId" className="text-sm font-medium text-gray-700">
          Provinsi
        </label>
        <select
          id="provinceId"
          name="provinceId"
          required
          value={selectedProvinceId}
          onChange={(event) => {
            setSelectedProvinceId(event.target.value);
            setSelectedCityId("");
            setSelectedDistrictId("");
          }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
          disabled={provinceState.loading || Boolean(provinceState.error)}
        >
          <option value="">{provinceState.loading ? "Memuat provinsi..." : "Pilih provinsi"}</option>
          {provinces.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {provinceState.error ? (
          <p className="text-xs text-red-600">
            {provinceState.error}{" "}
            <button
              type="button"
              className="font-semibold text-red-600 underline"
              onClick={() => setProvinceRequestKey((key) => key + 1)}
            >
              Coba lagi
            </button>
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="cityId" className="text-sm font-medium text-gray-700">
          Kota / Kabupaten
        </label>
        <select
          id="cityId"
          name="cityId"
          required
          value={selectedCityId}
          onChange={(event) => {
            setSelectedCityId(event.target.value);
            setSelectedDistrictId("");
          }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
          disabled={!selectedProvinceId || cityState.loading || Boolean(cityState.error)}
        >
          <option value="">
            {!selectedProvinceId
              ? "Pilih provinsi terlebih dahulu"
              : cityState.loading
              ? "Memuat kota/kabupaten..."
              : "Pilih kota/kabupaten"}
          </option>
          {cities.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {cityState.error ? (
          <p className="text-xs text-red-600">
            {cityState.error}{" "}
            <button
              type="button"
              className="font-semibold text-red-600 underline"
              onClick={() => setCityRequestKey((key) => key + 1)}
            >
              Coba lagi
            </button>
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="districtId" className="text-sm font-medium text-gray-700">
          Kecamatan
        </label>
        <select
          id="districtId"
          name="districtId"
          required
          value={selectedDistrictId}
          onChange={(event) => {
            setSelectedDistrictId(event.target.value);
          }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/30"
          disabled={!selectedCityId || districtState.loading || Boolean(districtState.error)}
        >
          <option value="">
            {!selectedCityId
              ? "Pilih kota/kabupaten terlebih dahulu"
              : districtState.loading
              ? "Memuat kecamatan..."
              : "Pilih kecamatan"}
          </option>
          {districts.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {districtState.error ? (
          <p className="text-xs text-red-600">
            {districtState.error}{" "}
            <button
              type="button"
              className="font-semibold text-red-600 underline"
              onClick={() => setDistrictRequestKey((key) => key + 1)}
            >
              Coba lagi
            </button>
          </p>
        ) : null}
      </div>

      <p className="text-xs text-gray-500 md:col-span-2">
        Data wilayah diambil dari Kemendagri (wilayah.id) melalui layanan gratis Emsifa. Kode pos akan dilengkapi
        otomatis saat checkout.
      </p>
    </>
  );
}
