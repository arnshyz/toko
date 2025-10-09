import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { sessionOptions, SessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const actor = session.user;

  if (!actor || !actor.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  const parentId = String(formData.get("parentId") || "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") || "").trim();
  const sortOrder = Number.parseInt(sortOrderRaw, 10);
  const finalSortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;

  if (!name) {
    return NextResponse.redirect(new URL(`/admin/categories?error=${encodeURIComponent("Nama kategori wajib diisi")}`, req.url));
  }

  const fallbackSlug = slugify(name) || slugify(`${name}-${Date.now()}`) || `kategori-${Date.now()}`;
  const slug = (slugInput && slugify(slugInput)) || fallbackSlug;

  try {
    await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        emoji: emoji || null,
        parentId: parentId || null,
        sortOrder: finalSortOrder,
        isActive: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    return NextResponse.redirect(new URL(`/admin/categories?error=${encodeURIComponent(message)}`, req.url));
  }

  return NextResponse.redirect(new URL(`/admin/categories?message=${encodeURIComponent("Kategori berhasil ditambahkan")}`, req.url));
}
