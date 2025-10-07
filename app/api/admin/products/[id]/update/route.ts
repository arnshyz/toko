import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";
import { generateUniqueProductSlug } from "@/lib/product-slug";

function parseNumber(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} wajib diisi`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} tidak valid`);
  }
  return parsed;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title");
  const category = formData.get("category");
  const description = formData.get("description");
  const sellerId = formData.get("sellerId");

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.redirect(new URL(`/admin/products?error=${encodeURIComponent("Nama produk wajib diisi")}`, req.url));
  }
  if (typeof category !== "string" || category.trim().length === 0) {
    return NextResponse.redirect(new URL(`/admin/products?error=${encodeURIComponent("Kategori wajib diisi")}`, req.url));
  }

  let price: number;
  let stock: number;
  try {
    price = parseNumber(formData.get("price"), "Harga");
    stock = parseNumber(formData.get("stock"), "Stok");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Input tidak valid";
    const redirectUrl = new URL("/admin/products", req.url);
    if (typeof sellerId === "string" && sellerId) {
      redirectUrl.searchParams.set("sellerId", sellerId);
    }
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new Error("Produk tidak ditemukan");
    }

    const trimmedTitle = title.trim();
    const updateData: Prisma.ProductUpdateInput = {
      title: trimmedTitle,
      category: category.trim(),
      description: typeof description === "string" ? description : null,
      price,
      stock,
      isActive: formData.get("isActive") === "on",
    };

    if (existing.title !== trimmedTitle) {
      updateData.slug = await generateUniqueProductSlug(trimmedTitle, existing.id);
    }

    await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui produk";
    const redirectUrl = new URL("/admin/products", req.url);
    if (typeof sellerId === "string" && sellerId) {
      redirectUrl.searchParams.set("sellerId", sellerId);
    }
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/admin/products", req.url);
  if (typeof sellerId === "string" && sellerId) {
    redirectUrl.searchParams.set("sellerId", sellerId);
  }
  redirectUrl.searchParams.set("message", "Produk berhasil diperbarui");
  return NextResponse.redirect(redirectUrl);
}
