import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";
import { buildVariantPayload, parseVariantInput, resolveCategorySlug } from "@/lib/product-form";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const toggle = String(form.get('toggle') || '');

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

  const prod = await prisma.product.findUnique({ where: { id: params.id } });
  if (!prod || prod.sellerId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (toggle) {
    await prisma.product.update({ where: { id: prod.id }, data: { isActive: !prod.isActive } });
    return NextResponse.redirect(new URL('/seller/products', req.url));
  }

  const title = String(form.get('title') || '').trim();
  const priceInput = String(form.get('price') || '').trim();
  const parsedPrice = Number.parseInt(priceInput, 10);
  const price = Number.isFinite(parsedPrice) ? parsedPrice : NaN;
  const stockInput = String(form.get('stock') || '').trim();
  const parsedStock = Number.parseInt(stockInput, 10);
  const stock = Number.isFinite(parsedStock) ? Math.max(parsedStock, 0) : 0;
  const originalPriceValue = String(form.get('originalPrice') || '').trim();
  const parsedOriginalPrice = originalPriceValue ? Number.parseInt(originalPriceValue, 10) : NaN;
  const originalPrice = Number.isFinite(parsedOriginalPrice) && parsedOriginalPrice > 0 ? parsedOriginalPrice : null;
  const description = String(form.get('description') || '').trim();
  const warehouseId = String(form.get('warehouseId') || '').trim();
  const categoryRaw = String(form.get('category') || '').trim();
  const variantsRaw = String(form.get('variants') || '').trim();

  if (!title || Number.isNaN(price)) {
    return NextResponse.redirect(
      new URL(`/seller/products/${prod.id}/edit?error=${encodeURIComponent('Form tidak valid')}`, req.url)
    );
  }

  const finalOriginalPrice = originalPrice && originalPrice > price ? originalPrice : null;
  const variantGroups = parseVariantInput(variantsRaw);
  const variantPayload = buildVariantPayload(variantGroups);

  const resolvedCategory = await resolveCategorySlug(categoryRaw);

  await prisma.product.update({
    where: { id: prod.id },
    data: {
      title,
      price,
      stock,
      description,
      warehouseId: warehouseId || null,
      category: resolvedCategory,
      originalPrice: finalOriginalPrice,
      variantOptions: variantPayload ?? Prisma.JsonNull,
    },
  });

  return NextResponse.redirect(new URL('/seller/products?updated=1', req.url));
}
