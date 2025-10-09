"use client";

import { useMemo } from "react";
import { VariantGroup } from "@/types/product";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type VariantSelectorProps = {
  groups: VariantGroup[];
  namePrefix?: string;
  value?: Record<string, string>;
  onSelectionChange?: (selection: Record<string, string>) => void;
};

const normalizeGroups = (groups: VariantGroup[]) =>
  groups
    .filter((group) => Array.isArray(group.options) && group.options.length > 0)
    .map((group) => ({
      name: group.name,
      options: [...group.options],
    }));

export function VariantSelector({
  groups,
  namePrefix = "variant",
  value,
  onSelectionChange,
}: VariantSelectorProps) {
  const safeGroups = useMemo(() => normalizeGroups(Array.isArray(groups) ? groups : []), [groups]);

  const baseSelection = useMemo(() => {
    const entries = safeGroups.map((group) => [group.name, group.options[0]] as const);
    return Object.fromEntries(entries);
  }, [safeGroups]);

  const selected = useMemo(() => {
    const next = { ...baseSelection } as Record<string, string>;
    if (value && typeof value === "object") {
      for (const [groupName, option] of Object.entries(value)) {
        const targetGroup = safeGroups.find((group) => group.name === groupName);
        if (targetGroup && targetGroup.options.includes(option)) {
          next[groupName] = option;
        }
      }
    }
    return next;
  }, [baseSelection, safeGroups, value]);

  if (safeGroups.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Varian tidak tersedia untuk produk ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeGroups.map((group) => {
        const currentValue = selected[group.name] ?? group.options[0];
        return (
          <div key={group.name} className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">{group.name}</div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isActive = option === currentValue;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (typeof onSelectionChange !== "function") return;

                      const nextSelection = { ...selected, [group.name]: option };
                      onSelectionChange(nextSelection);
                    }}
                    className={`rounded-full border px-4 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isActive
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <input
              type="hidden"
              name={`${namePrefix}[${slugify(group.name)}]`}
              value={currentValue}
            />
          </div>
        );
      })}
    </div>
  );
}
