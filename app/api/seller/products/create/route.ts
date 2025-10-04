import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get('title') || '');
  const price = Number.parseInt(String(form.get('price') ?? '0'), 10) || 0;
  const stock = Number.parseInt(String(form.get('stock') ?? '0'), 10) || 0;
  const imageUrl = String(form.get('imageUrl') || '');
  const description = String(form.get('description') || '');
  const warehouseId = String(form.get('warehouseId') || '');
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
    },
  });
  return NextResponse.redirect(new URL('/seller/products', req.url));
}
