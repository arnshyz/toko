"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VariantGroup } from "@/types/product";
import { VariantSelector } from "./VariantSelector";
import { AddToCartForm, type AddToCartFormProps } from "./AddToCartForm";

const formatVariantNote = (selection: Record<string, string>) => {
  const entries = Object.entries(selection).filter(([, value]) => value);
  if (entries.length === 0) {
    return "";
  }
  return entries.map(([name, value]) => `${name}: ${value}`).join(" • ");
};

type ProductPurchaseOptionsProps = Omit<AddToCartFormProps, "variant"> & {
  variantGroups: VariantGroup[];
  showSingleVariantNotice?: boolean;
};

export function ProductPurchaseOptions({
  variantGroups,
  showSingleVariantNotice = false,
  ...addToCartProps
}: ProductPurchaseOptionsProps) {
  const variantSignature = useMemo(() => JSON.stringify(variantGroups), [variantGroups]);

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initialEntries = variantGroups
      .filter((group) => Array.isArray(group.options) && group.options.length > 0)
      .map((group) => [group.name, group.options[0] ?? ""] as const);
    return Object.fromEntries(initialEntries);
  });

  useEffect(() => {
    setSelection((prev) => {
      const next: Record<string, string> = {};

      variantGroups.forEach((group) => {
        if (!Array.isArray(group.options) || group.options.length === 0) {
          return;
        }

        const prevValue = prev[group.name];
        const fallback = group.options[0] ?? "";
        next[group.name] = prevValue && group.options.includes(prevValue) ? prevValue : fallback;
      });

      return next;
    });
  }, [variantSignature]);

  const variantNote = useMemo(() => formatVariantNote(selection), [selection]);
  const trimmedNote = variantNote.trim();
  const selectedVariants = useMemo(() => {
    const entries = Object.entries(selection).filter(([, value]) => value);
    if (entries.length === 0) {
      return undefined;
    }
    return Object.fromEntries(entries);
  }, [selection]);

  const handleSelectionChange = useCallback((next: Record<string, string>) => {
    setSelection(next);
  }, []);

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Varian</h2>
        <VariantSelector
          groups={variantGroups}
          value={selection}
          onSelectionChange={handleSelectionChange}
        />
        {showSingleVariantNotice ? (
          <p className="mt-3 text-xs text-gray-500">
            Penjual belum menambahkan detail varian, produk tersedia dalam 1 pilihan standar.
          </p>
        ) : null}
        {trimmedNote ? (
          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
            Catatan pesanan otomatis: {trimmedNote}
          </p>
        ) : null}
      </div>
      <div className="hidden lg:block">
        <AddToCartForm
          {...addToCartProps}
          orderNote={trimmedNote || undefined}
          selectedVariants={selectedVariants}
        />
      </div>
      <AddToCartForm
        {...addToCartProps}
        orderNote={trimmedNote || undefined}
        selectedVariants={selectedVariants}
        variant="mobile"
      />
    </>
  );
}
