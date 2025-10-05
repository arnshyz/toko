export type ProductCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
};

export const productCategories: ProductCategory[] = [
  { slug: "elektronik", name: "Elektronik", description: "Gadget & aksesoris", emoji: "🔌" },
  { slug: "fashion", name: "Fashion", description: "Gaya terkini", emoji: "👗" },
  { slug: "rumah-tangga", name: "Rumah Tangga", description: "Peralatan rumah", emoji: "🏠" },
  { slug: "kecantikan", name: "Kecantikan", description: "Perawatan diri", emoji: "💄" },
  { slug: "olahraga", name: "Olahraga", description: "Perlengkapan sport", emoji: "🏃" },
  { slug: "hobi", name: "Hobi", description: "Koleksi & hobi", emoji: "🎨" },
  { slug: "otomotif", name: "Otomotif", description: "Aksesoris kendaraan", emoji: "🚗" },
  { slug: "makanan", name: "Makanan & Minuman", description: "Kuliner Nusantara", emoji: "🍜" }
];

export function getCategoryInfo(slug: string) {
  return productCategories.find((category) => category.slug === slug);
}
