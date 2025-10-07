import { Buffer } from "buffer";

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

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });
  if (!account || account.isBanned) {
    return NextResponse.redirect(new URL('/seller/login?error=banned', req.url));
  }

  if (account.sellerOnboardingStatus !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/seller/onboarding', req.url));
  }

  const finalOriginalPrice = originalPrice && originalPrice > price ? originalPrice : null;

  const files = form
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > 5) {
    return NextResponse.redirect(
      new URL(`/seller/products?error=${encodeURIComponent('Maksimal 5 gambar diperbolehkan')}`, req.url)
    );
  }

  const validatedFiles = files.filter((file) => file.type.startsWith('image/'));

  const product = await prisma.product.create({
    data: {
      sellerId: user.id,
      title,
      price,
      stock,
      description,
      warehouseId: warehouseId || null,
      category,
      originalPrice: finalOriginalPrice,
      variantOptions: variantPayload,
    }
  });
  if (validatedFiles.length > 0) {
    await Promise.all(
      validatedFiles.map(async (file, index) => {
        const arrayBuffer = await file.arrayBuffer();
        await prisma.productImage.create({
          data: {
            productId: product.id,
            mimeType: file.type || 'application/octet-stream',
            data: Buffer.from(arrayBuffer),
            sortOrder: index,
          },
        });
      })
    );
  }
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
