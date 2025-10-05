import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { productCategories } from "@/lib/categories";
import { VariantGroup } from "@/types/product";

function parseVariantInput(raw: string): VariantGroup[] {
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

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get('title') || '');
  const price = parseInt(String(form.get('price') || '0'))||0;
  const stock = parseInt(String(form.get('stock') || '0'))||0;
  const originalPriceValue = String(form.get('originalPrice') || '').trim();
  const parsedOriginalPrice = originalPriceValue ? parseInt(originalPriceValue, 10) : NaN;
  const originalPrice = Number.isFinite(parsedOriginalPrice) && parsedOriginalPrice > 0 ? parsedOriginalPrice : null;
  const imageUrl = String(form.get('imageUrl') || '');
  const description = String(form.get('description') || '');
  const warehouseId = String(form.get('warehouseId') || '');
  const categoryValue = String(form.get('category') || '').trim();
  const variantsRaw = String(form.get('variants') || '').trim();
  const fallbackCategory = productCategories[0]?.slug || 'umum';
  const category = categoryValue && productCategories.some((item) => item.slug === categoryValue)
    ? categoryValue
    : fallbackCategory;

  const variantGroups = parseVariantInput(variantsRaw);
  const variantPayload: Prisma.InputJsonValue | undefined = variantGroups.length > 0
    ? (variantGroups.map((group) => ({
        name: group.name,
        options: [...group.options],
      })) as Prisma.InputJsonValue)
    : undefined;


  const res = new NextResponse(null);

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const finalOriginalPrice = originalPrice && originalPrice > price ? originalPrice : null;

  await prisma.product.create({
    data: {
      sellerId: user.id,
      title,
      price,
      stock,
      imageUrl,
      description,
      warehouseId: warehouseId || null,
      category,
      originalPrice: finalOriginalPrice,
      variantOptions: variantPayload,
    }
  });
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
