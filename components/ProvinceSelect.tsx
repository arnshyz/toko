"use client";

import { useEffect, useMemo, useState } from "react";

type Province = {
  id: string;
  name: string;
};

type ProvinceSelectProps = {
  id?: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
};

const PROVINCES_ENDPOINT =
  "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json";

export function ProvinceSelect({
  id,
  name,
  required,
  defaultValue,
  className,
}: ProvinceSelectProps) {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProvinces() {
      setIsLoading(true);
      try {
        const response = await fetch(PROVINCES_ENDPOINT, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: Province[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response shape");
        }

        setProvinces(
          data
            .filter((province): province is Province =>
              Boolean(province && province.id && province.name),
            )
            .map((province) => ({
              id: String(province.id),
              name: province.name.trim(),
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to load provinces", err);
        setError("Gagal memuat daftar provinsi. Silakan isi secara manual.");
        setProvinces(null);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProvinces();

    return () => {
      controller.abort();
    };
  }, []);

  const normalizedDefaultValue = useMemo(() => defaultValue?.trim() ?? "", [defaultValue]);

  if (error) {
    return (
      <div className="space-y-1">
        <input
          id={id}
          name={name}
          type="text"
          required={required}
          defaultValue={normalizedDefaultValue}
          placeholder="Tulis provinsi"
          className={className}
        />
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={normalizedDefaultValue}
      className={className}
      disabled={isLoading && !provinces}
    >
      <option value="">{isLoading ? "Memuat provinsi..." : "Pilih provinsi"}</option>
      {(provinces ?? []).map((province) => (
        <option key={province.id} value={province.name}>
          {province.name}
        </option>
      ))}
    </select>
  );
}
