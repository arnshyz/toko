"use client";

import { useEffect, useMemo, useState } from "react";

type ProvinceOption = {
  id: string;
  name: string;
};

type CityOption = {
  id: string;
  name: string;
  type: string;
};

type SubdistrictOption = {
  id: string;
  name: string;
};

type AddressRegionFieldsProps = {
  idPrefix: string;
  defaultProvince?: string;
  defaultCity?: string;
  defaultDistrict?: string;
};

const FIELD_CLASSNAME =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function fetchJson<T>(input: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(input, { signal, cache: "no-store" });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore JSON parsing errors
    }
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export function AddressRegionFields({
  idPrefix,
  defaultProvince = "",
  defaultCity = "",
  defaultDistrict = "",
}: AddressRegionFieldsProps) {
  const normalizedDefaultProvince = useMemo(() => defaultProvince.trim(), [defaultProvince]);
  const normalizedDefaultCity = useMemo(() => defaultCity.trim(), [defaultCity]);
  const normalizedDefaultDistrict = useMemo(() => defaultDistrict.trim(), [defaultDistrict]);

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [provinceStatus, setProvinceStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [provinceError, setProvinceError] = useState<string | null>(null);
  const [provinceValue, setProvinceValue] = useState(normalizedDefaultProvince);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityStatus, setCityStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityValue, setCityValue] = useState(normalizedDefaultCity);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCityIsStatic, setSelectedCityIsStatic] = useState(false);

  const [subdistrictOptions, setSubdistrictOptions] = useState<SubdistrictOption[]>([]);
  const [subdistrictStatus, setSubdistrictStatus] = useState<
    "idle" | "loading" | "loaded" | "error" | "unsupported"
  >(normalizedDefaultDistrict ? "idle" : "idle");
  const [subdistrictError, setSubdistrictError] = useState<string | null>(null);
  const [subdistrictValue, setSubdistrictValue] = useState(normalizedDefaultDistrict);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProvinces() {
      setProvinceStatus("loading");
      try {
        const data = await fetchJson<ProvinceOption[]>("/api/rajaongkir/provinces", controller.signal);
        setProvinceOptions(data);
        setProvinceStatus("loaded");
        setProvinceError(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch provinces", error);
        setProvinceError("Gagal memuat provinsi. Silakan isi manual.");
        setProvinceStatus("error");
      }
    }

    void loadProvinces();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (provinceStatus !== "loaded") {
      return;
    }
    if (!provinceValue) {
      setSelectedProvinceId(null);
      return;
    }
    const normalized = normalize(provinceValue);
    const matched = provinceOptions.find((option) => normalize(option.name) === normalized);
    setSelectedProvinceId(matched ? matched.id : null);
  }, [provinceStatus, provinceOptions, provinceValue]);

  useEffect(() => {
    if (!selectedProvinceId) {
      setCityOptions([]);
      setCityStatus("idle");
      setCityError(null);
      setSelectedCityId(null);
      setSelectedCityIsStatic(false);
      return;
    }

    const controller = new AbortController();
    const provinceId = selectedProvinceId as string;

    async function loadCities() {
      setCityStatus("loading");
      try {
        const data = await fetchJson<CityOption[]>(
          `/api/rajaongkir/cities?province=${encodeURIComponent(provinceId)}`,
          controller.signal,
        );
        setCityOptions(data);
        setCityStatus("loaded");
        setCityError(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch cities", error);
        setCityError("Gagal memuat kota/kabupaten. Silakan isi manual.");
        setCityStatus("error");
        setSelectedCityIsStatic(false);
      }
    }

    void loadCities();

    return () => {
      controller.abort();
    };
  }, [selectedProvinceId]);

  useEffect(() => {
    if (cityStatus !== "loaded") {
      setSelectedCityId(null);
      setSelectedCityIsStatic(false);
      return;
    }
    if (!cityValue) {
      setSelectedCityId(null);
      setSelectedCityIsStatic(false);
      return;
    }
    const normalized = normalize(cityValue);
    const matched = cityOptions.find((option) => {
      const displayName = `${option.type} ${option.name}`.replace(/\s+/g, " ").trim();
      return normalize(displayName) === normalized || normalize(option.name) === normalized;
    });
    if (matched) {
      setSelectedCityId(matched.id);
      setSelectedCityIsStatic(!/^\d+$/.test(matched.id));
    } else {
      setSelectedCityId(null);
      setSelectedCityIsStatic(false);
    }
  }, [cityStatus, cityOptions, cityValue]);

  useEffect(() => {
    if (!selectedCityId) {
      setSubdistrictOptions([]);
      setSubdistrictStatus("idle");
      setSubdistrictError(null);
      return;
    }

    if (selectedCityIsStatic) {
      setSubdistrictOptions([]);
      setSubdistrictStatus("unsupported");
      setSubdistrictError(
        "Daftar kecamatan tidak tersedia ketika menggunakan data kota statis. Silakan isi manual.",
      );
      return;
    }

    const controller = new AbortController();
    const cityId = selectedCityId as string;

    async function loadSubdistricts() {
      setSubdistrictStatus("loading");
      try {
        const data = await fetch(`/api/rajaongkir/subdistricts?city=${encodeURIComponent(cityId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (data.status === 501) {
          let message = "Kecamatan tidak tersedia dari API. Isi manual.";
          try {
            const body = (await data.json()) as { error?: string };
            if (body?.error) {
              message = body.error;
            }
          } catch {
            // ignore parsing error
          }
          setSubdistrictError(message);
          setSubdistrictOptions([]);
          setSubdistrictStatus("unsupported");
          return;
        }

        if (!data.ok) {
          let message = data.statusText;
          try {
            const body = (await data.json()) as { error?: string };
            if (body?.error) {
              message = body.error;
            }
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const body = (await data.json()) as SubdistrictOption[];
        setSubdistrictOptions(body);
        setSubdistrictStatus("loaded");
        setSubdistrictError(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch subdistricts", error);
        setSubdistrictError("Gagal memuat kecamatan. Silakan isi manual.");
        setSubdistrictOptions([]);
        setSubdistrictStatus("error");
      }
    }

    void loadSubdistricts();

    return () => {
      controller.abort();
    };
  }, [selectedCityId]);

  const provinceFallback = provinceStatus === "error";
  const cityFallback = provinceFallback || cityStatus === "error";
  const subdistrictFallback =
    provinceFallback || cityFallback || subdistrictStatus === "error" || subdistrictStatus === "unsupported";

  return (
    <>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-province`} className="text-sm font-medium text-gray-700">
          Provinsi
        </label>
        {provinceFallback ? (
          <>
            <input
              id={`${idPrefix}-province`}
              name="province"
              type="text"
              required
              defaultValue={provinceValue}
              placeholder="Tulis provinsi"
              className={FIELD_CLASSNAME}
            />
            {provinceError ? <p className="text-xs text-red-600">{provinceError}</p> : null}
          </>
        ) : (
          <select
            id={`${idPrefix}-province`}
            name="province"
            required
            className={FIELD_CLASSNAME}
            value={provinceValue}
            onChange={(event) => {
              const value = event.target.value;
              setProvinceValue(value);
              setCityValue("");
              setSelectedCityId(null);
              setSubdistrictValue("");
              setSubdistrictOptions([]);
              setSubdistrictStatus("idle");
              setCityError(null);
              setSubdistrictError(null);
            }}
            disabled={provinceStatus !== "loaded"}
          >
            <option value="">
              {provinceStatus === "loading" ? "Memuat provinsi..." : "Pilih provinsi"}
            </option>
            {provinceValue &&
            provinceOptions.every((option) => normalize(option.name) !== normalize(provinceValue)) ? (
              <option value={provinceValue}>{provinceValue}</option>
            ) : null}
            {provinceOptions.map((province) => (
              <option key={province.id} value={province.name} data-id={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-city`} className="text-sm font-medium text-gray-700">
          Kota / Kabupaten
        </label>
        {cityFallback ? (
          <>
            <input
              id={`${idPrefix}-city`}
              name="city"
              type="text"
              required
              defaultValue={cityValue}
              placeholder="Tulis kota atau kabupaten"
              className={FIELD_CLASSNAME}
            />
            {cityError ? <p className="text-xs text-red-600">{cityError}</p> : null}
          </>
        ) : (
          <select
            id={`${idPrefix}-city`}
            name="city"
            required
            className={FIELD_CLASSNAME}
            value={cityValue}
            onChange={(event) => {
              const value = event.target.value;
              setCityValue(value);
              setSubdistrictValue("");
              setSubdistrictOptions([]);
              setSubdistrictStatus("idle");
              setSubdistrictError(null);
              setSelectedCityIsStatic(false);
            }}
            disabled={provinceStatus !== "loaded" || !selectedProvinceId || cityStatus === "loading"}
          >
            <option value="">
              {selectedProvinceId
                ? cityStatus === "loading"
                  ? "Memuat kota/kabupaten..."
                  : "Pilih kota/kabupaten"
                : "Pilih provinsi terlebih dahulu"}
            </option>
            {cityValue &&
            cityOptions.every((option) => {
              const displayName = `${option.type} ${option.name}`.replace(/\s+/g, " ").trim();
              return (
                normalize(displayName) !== normalize(cityValue) && normalize(option.name) !== normalize(cityValue)
              );
            }) ? (
              <option value={cityValue}>{cityValue}</option>
            ) : null}
            {cityOptions.map((city) => {
              const displayName = `${city.type} ${city.name}`.replace(/\s+/g, " ").trim();
              return (
                <option key={city.id} value={displayName} data-id={city.id}>
                  {displayName}
                </option>
              );
            })}
          </select>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-district`} className="text-sm font-medium text-gray-700">
          Kecamatan
        </label>
        {subdistrictFallback ? (
          <>
            <input
              id={`${idPrefix}-district`}
              name="district"
              type="text"
              required
              defaultValue={subdistrictValue}
              placeholder="Tulis kecamatan"
              className={FIELD_CLASSNAME}
            />
            {subdistrictError ? (
              <p
                className={`text-xs ${
                  subdistrictStatus === "unsupported" ? "text-amber-600" : "text-red-600"
                }`}
              >
                {subdistrictError}
              </p>
            ) : null}
          </>
        ) : (
          <select
            id={`${idPrefix}-district`}
            name="district"
            required
            className={FIELD_CLASSNAME}
            value={subdistrictValue}
            onChange={(event) => {
              setSubdistrictValue(event.target.value);
            }}
            disabled={
              provinceStatus !== "loaded" ||
              !selectedProvinceId ||
              !selectedCityId ||
              subdistrictStatus === "loading"
            }
          >
            <option value="">
              {selectedCityId
                ? subdistrictStatus === "loading"
                  ? "Memuat kecamatan..."
                  : "Pilih kecamatan"
                : selectedProvinceId
                ? "Pilih kota/kabupaten terlebih dahulu"
                : "Pilih provinsi terlebih dahulu"}
            </option>
            {subdistrictValue &&
            subdistrictOptions.every((option) => normalize(option.name) !== normalize(subdistrictValue)) ? (
              <option value={subdistrictValue}>{subdistrictValue}</option>
            ) : null}
            {subdistrictOptions.map((subdistrict) => (
              <option key={subdistrict.id} value={subdistrict.name}>
                {subdistrict.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
