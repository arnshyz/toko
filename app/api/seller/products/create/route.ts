import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get('title') || '');
  const price = parseInt(String(form.get('price') || '0'))||0;
  const stock = parseInt(String(form.get('stock') || '0'))||0;
  const imageUrl = String(form.get('imageUrl') || '');
  const description = String(form.get('description') || '');
  const warehouseId = String(form.get('warehouseId') || '');
  const variantGroupsEntry = form.get('variantGroups');

  let variantPayload: Prisma.InputJsonValue | undefined;

  if (typeof variantGroupsEntry === 'string' && variantGroupsEntry.trim()) {
    try {
      const parsed = JSON.parse(variantGroupsEntry) as unknown;

      if (Array.isArray(parsed) && parsed.length > 0) {
        variantPayload = parsed.map((group) => {
          if (group && typeof group === 'object') {
            const plainGroup = { ...(group as Record<string, unknown>) };
            const options = (plainGroup as { options?: unknown }).options;

            if (Array.isArray(options)) {
              plainGroup["options"] = options.map((option) =>
                option && typeof option === 'object'
                  ? { ...(option as Record<string, unknown>) }
                  : option
              );
            }

            return plainGroup;
          }

          return group;
        }) as Prisma.InputJsonValue;
      }
    } catch (error) {
      console.error('Failed to parse variant groups', error);
    }
  }

  const res = new NextResponse(null);

  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user as SessionUser | undefined;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.product.create({
    data: {
      sellerId: user.id,
      title,
      price,
      stock,
      imageUrl,
      description,
      warehouseId: warehouseId || null,
      variantOptions: variantPayload || undefined,
    },
  });
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
