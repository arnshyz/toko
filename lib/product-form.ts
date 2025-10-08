import { getProductCategoryOptions } from "@/lib/categories";
import { VariantGroup } from "@/types/product";

type VariantJson = {
  name?: unknown;
  options?: unknown;
};

export function parseVariantInput(raw: string): VariantGroup[] {
  if (!raw.trim()) return [];

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, optionsPart = ""] = line.split(":");
      const name = namePart.trim();
      const options = optionsPart
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);

      if (!name) {
        return null;
      }

      return {
        name,
        options: options.length > 0 ? options : ["Default"],
      } satisfies VariantGroup;
    })
    .filter((group): group is VariantGroup => Boolean(group));
}

export function buildVariantPayload(variantGroups: VariantGroup[]) {
  if (variantGroups.length === 0) {
    return null;
  }

  return variantGroups.map((group) => ({
    name: group.name,
    options: [...group.options],
  }));
}

export function stringifyVariantGroups(variantOptions: unknown): string {
  if (!Array.isArray(variantOptions)) return "";

  const lines = variantOptions
    .map((item) => {
      const group = item as VariantJson;
      const name = typeof group.name === "string" ? group.name.trim() : "";
      if (!name) return null;

      const options = Array.isArray(group.options)
        ? group.options.filter((option): option is string => typeof option === "string" && option.trim().length > 0)
        : [];

      const optionsPart = options.length > 0 ? options.join(", ") : "";
      return optionsPart ? `${name}: ${optionsPart}` : `${name}:`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export async function resolveCategorySlug(rawCategory: string) {
  const trimmed = rawCategory.trim();
  const options = await getProductCategoryOptions();
  const fallback = options[0]?.slug || "umum";

  if (!trimmed) return fallback;
  return options.some((category) => category.slug === trimmed) ? trimmed : fallback;
}
