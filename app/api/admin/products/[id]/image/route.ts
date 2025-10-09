import { Buffer } from "buffer";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";
import { getIronSession } from "iron-session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const sellerId = formData.get("sellerId");
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    const redirectUrl = new URL("/admin/products", req.url);
    if (typeof sellerId === "string" && sellerId) {
      redirectUrl.searchParams.set("sellerId", sellerId);
    }
    redirectUrl.searchParams.set("error", "Mohon unggah file gambar yang valid.");
    return NextResponse.redirect(redirectUrl);
  }

  if (!file.type.startsWith("image/")) {
    const redirectUrl = new URL("/admin/products", req.url);
    if (typeof sellerId === "string" && sellerId) {
      redirectUrl.searchParams.set("sellerId", sellerId);
    }
    redirectUrl.searchParams.set("error", "File yang diunggah harus berupa gambar.");
    return NextResponse.redirect(redirectUrl);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: params.id } }),
    prisma.productImage.create({
      data: {
        productId: params.id,
        mimeType: file.type,
        data: buffer,
        sortOrder: 0,
      },
    }),
    prisma.product.update({
      where: { id: params.id },
      data: { imageUrl: null },
    }),
  ]);

  const redirectUrl = new URL("/admin/products", req.url);
  if (typeof sellerId === "string" && sellerId) {
    redirectUrl.searchParams.set("sellerId", sellerId);
  }
  redirectUrl.searchParams.set("message", "Foto produk berhasil diperbarui");
  return NextResponse.redirect(redirectUrl);
}
