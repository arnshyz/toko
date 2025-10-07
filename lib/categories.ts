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

export const productCategories: ProductCategory[] = [
  { slug: "elektronik", name: "Elektronik", description: "Gadget & aksesoris", emoji: "🔌" },
  { slug: "fashion", name: "Fashion", description: "Gaya terkini", emoji: "👗" },
  { slug: "rumah-tangga", name: "Rumah Tangga", description: "Peralatan rumah", emoji: "🏠" },
  { slug: "kecantikan", name: "Kecantikan", description: "Perawatan diri", emoji: "💄" },
  { slug: "olahraga", name: "Olahraga", description: "Perlengkapan sport", emoji: "🏃" },
  { slug: "hobi", name: "Hobi", description: "Koleksi & hobi", emoji: "🎨" },
  { slug: "otomotif", name: "Otomotif", description: "Aksesoris kendaraan", emoji: "🚗" },
  { slug: "makanan", name: "Makanan & Minuman", description: "Kuliner Nusantara", emoji: "🍜" },
  {
    slug: "produk-digital",
    name: "Produk Digital",
    description: "Produk virtual, software, dan layanan instan",
    emoji: "💾",
    subCategories: [
      { slug: "produk-digital-akun", name: "Akun" },
      { slug: "produk-digital-tools-software", name: "Tools & Software" },
      { slug: "produk-digital-voucher", name: "Voucher" },
      { slug: "produk-digital-jasa", name: "Jasa" },
      { slug: "produk-digital-desain-grafis", name: "Desain Grafis" },
      { slug: "produk-digital-ebook-template", name: "Ebook & Template" },
    ],
  },
];

export const productCategoryOptions: CategoryOption[] = productCategories.flatMap((category) => {
  const baseOption: CategoryOption = {
    slug: category.slug,
    name: category.name,
    description: category.description,
    emoji: category.emoji,
  };

  const children = (category.subCategories ?? []).map<CategoryOption>((sub) => ({
    slug: sub.slug,
    name: sub.name,
    description: sub.description ?? category.description,
    emoji: category.emoji,
    parentSlug: category.slug,
    parentName: category.name,
  }));

  return [baseOption, ...children];
});

export function getCategoryInfo(slug: string) {
  const info = productCategoryOptions.find((category) => category.slug === slug);
  if (!info) {
    return undefined;
  }

  const parent = info.parentSlug
    ? productCategories.find((category) => category.slug === info.parentSlug)
    : undefined;

  return { ...info, parent };
}

export function getCategoryWithChildrenSlugs(slug: string) {
  const info = getCategoryInfo(slug);
  if (!info) {
    return [] as string[];
  }

  if (info.parentSlug) {
    return [info.slug];
  }

  const children = productCategoryOptions
    .filter((category) => category.parentSlug === info.slug)
    .map((category) => category.slug);

  return [info.slug, ...children];
}
