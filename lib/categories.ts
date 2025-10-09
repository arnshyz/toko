import { prisma } from "@/lib/prisma";

export type ProductSubCategory = {
  slug: string;
  name: string;
  description?: string;
};

export type ProductCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  subCategories?: ProductSubCategory[];
};

export type CategoryOption = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  parentSlug?: string;
  parentName?: string;
};

export type CategoryInfo = CategoryOption & { parent?: ProductCategory };

type CategoryDataset = {
  categories: ProductCategory[];
  options: CategoryOption[];
  infoBySlug: Map<string, CategoryInfo>;
};

type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  emoji: string | null;
  parentId: string | null;
};

const FALLBACK_CATEGORY: ProductCategory = {
  slug: "umum",
  name: "Umum",
  description: "Semua produk",
  emoji: "🛒",
};

const FALLBACK_OPTION: CategoryOption = {
  slug: FALLBACK_CATEGORY.slug,
  name: FALLBACK_CATEGORY.name,
  description: FALLBACK_CATEGORY.description,
  emoji: FALLBACK_CATEGORY.emoji,
};

function ensureDescription(...values: (string | null | undefined)[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "Temukan produk pilihan";
}

function ensureEmoji(value: string | null | undefined) {
  return value && value.trim() ? value.trim() : "🏷️";
}

function buildDataset(records: CategoryRecord[]): CategoryDataset {
  if (records.length === 0) {
    const infoBySlug = new Map<string, CategoryInfo>();
    infoBySlug.set(FALLBACK_OPTION.slug, { ...FALLBACK_OPTION });
    return {
      categories: [FALLBACK_CATEGORY],
      options: [FALLBACK_OPTION],
      infoBySlug,
    };
  }

  const byId = new Map(records.map((record) => [record.id, record] as const));
  const byParent = new Map<string, CategoryRecord[]>();
  const rootCandidates: CategoryRecord[] = [];

  for (const record of records) {
    if (!record.parentId || !byId.has(record.parentId)) {
      rootCandidates.push(record);
    }
    if (record.parentId) {
      const list = byParent.get(record.parentId) ?? [];
      list.push(record);
      byParent.set(record.parentId, list);
    }
  }

  if (!rootCandidates.length) {
    rootCandidates.push(...records);
  }

  const uniqueRoots = Array.from(new Set(rootCandidates.map((record) => record.id))).map(
    (id) => byId.get(id)!,
  );

  const infoBySlug = new Map<string, CategoryInfo>();
  const options: CategoryOption[] = [];

  const categories: ProductCategory[] = uniqueRoots.map((root) => {
    const description = ensureDescription(root.description);
    const emoji = ensureEmoji(root.emoji);

    const children = (byParent.get(root.id) ?? []).map<ProductSubCategory>((child) => ({
      slug: child.slug,
      name: child.name,
      description: child.description ?? description,
    }));

    const category: ProductCategory = {
      slug: root.slug,
      name: root.name,
      description,
      emoji,
      subCategories: children.length ? children : undefined,
    };

    const baseOption: CategoryOption = {
      slug: category.slug,
      name: category.name,
      description: category.description,
      emoji: category.emoji,
    };

    options.push(baseOption);
    infoBySlug.set(baseOption.slug, { ...baseOption });

    for (const child of children) {
      const childOption: CategoryOption = {
        slug: child.slug,
        name: child.name,
        description: child.description ?? category.description,
        emoji: category.emoji,
        parentSlug: category.slug,
        parentName: category.name,
      };
      options.push(childOption);
      infoBySlug.set(childOption.slug, { ...childOption, parent: category });
    }

    return category;
  });

  if (!categories.length) {
    const infoBySlugFallback = new Map<string, CategoryInfo>();
    infoBySlugFallback.set(FALLBACK_OPTION.slug, { ...FALLBACK_OPTION });
    return {
      categories: [FALLBACK_CATEGORY],
      options: [FALLBACK_OPTION],
      infoBySlug: infoBySlugFallback,
    };
  }

  return { categories, options, infoBySlug };
}

export async function getCategoryDataset(): Promise<CategoryDataset> {
  const records = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      emoji: true,
      parentId: true,
    },
  });

  return buildDataset(records);
}

export async function getProductCategories() {
  const { categories } = await getCategoryDataset();
  return categories;
}

export async function getProductCategoryOptions() {
  const { options } = await getCategoryDataset();
  return options;
}

export async function getCategoryInfo(slug: string) {
  const { infoBySlug } = await getCategoryDataset();
  return infoBySlug.get(slug);
}

export async function getCategoryWithChildrenSlugs(slug: string) {
  const dataset = await getCategoryDataset();
  const info = dataset.infoBySlug.get(slug);
  if (!info) {
    return [] as string[];
  }

  if (info.parentSlug) {
    return [info.slug];
  }

  const childSlugs = dataset.options
    .filter((option) => option.parentSlug === info.slug)
    .map((option) => option.slug);

  return [info.slug, ...childSlugs];
}

export async function resolveCategorySlug(rawCategory: string) {
  const trimmed = rawCategory.trim();
  const options = await getProductCategoryOptions();
  const fallback = options[0]?.slug || FALLBACK_OPTION.slug;
  if (!trimmed) return fallback;
  return options.some((category) => category.slug === trimmed) ? trimmed : fallback;
}
