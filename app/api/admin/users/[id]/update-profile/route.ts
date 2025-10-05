import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { ProfileChangeStatus, StoreBadge } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

type StoreBadgeValue = (typeof StoreBadge)[keyof typeof StoreBadge];

function safeNumber(value: FormDataEntryValue | null, options?: { min?: number }) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Input numerik tidak valid");
  }
  if (typeof options?.min === "number" && parsed < options.min) {
    throw new Error("Nilai numerik terlalu kecil");
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

  const name = formData.get("name");
  const storeName = formData.get("storeName");
  const email = formData.get("email");
  const slug = formData.get("slug");
  const badge = formData.get("badge");
  const storeIsOnline = formData.get("storeIsOnline") === "on";
  const avatarUrl = formData.get("avatarUrl");

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent("Nama wajib diisi")}`, req.url));
  }
  if (typeof storeName !== "string" || storeName.trim().length === 0) {
    return NextResponse.redirect(
      new URL(`/admin/users?error=${encodeURIComponent("Nama toko wajib diisi")}`, req.url),
    );
  }
  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent("Email wajib diisi")}`, req.url));
  }
  if (typeof slug !== "string" || slug.trim().length === 0) {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent("Slug wajib diisi")}`, req.url));
  }
  if (typeof badge !== "string") {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent("Badge tidak valid")}`, req.url));
  }
  const allowedBadges = Object.values(StoreBadge);
  if (!allowedBadges.includes(badge as StoreBadgeValue)) {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent("Badge tidak ditemukan")}`, req.url));
  }

  let avatarUrlValue: string | null | undefined = undefined;
  if (typeof avatarUrl === "string") {
    const trimmed = avatarUrl.trim();
    if (trimmed.length === 0) {
      avatarUrlValue = null;
    } else {
      try {
        const parsed = new URL(trimmed);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("URL foto harus menggunakan protokol http/https");
        }
        avatarUrlValue = trimmed;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "URL foto profil tidak valid";
        return NextResponse.redirect(
          new URL(`/admin/users?error=${encodeURIComponent(message)}`, req.url),
        );
      }
    }
  }

  let storeRating: number | undefined;
  let storeRatingCount: number | undefined;
  let storeFollowers: number | undefined;
  let storeFollowing: number | undefined;

  try {
    storeRating = safeNumber(formData.get("storeRating"), { min: 0 });
    if (typeof storeRating !== "undefined" && storeRating > 5) {
      throw new Error("Rating maksimal 5");
    }
    storeRatingCount = safeNumber(formData.get("storeRatingCount"), { min: 0 });
    storeFollowers = safeNumber(formData.get("storeFollowers"), { min: 0 });
    storeFollowing = safeNumber(formData.get("storeFollowing"), { min: 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Input tidak valid";
    return NextResponse.redirect(
      new URL(`/admin/users?error=${encodeURIComponent(message)}`, req.url),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          storeName: storeName.trim(),
          email: email.trim().toLowerCase(),
          slug: slug.trim().toLowerCase(),
          storeBadge: badge as StoreBadgeValue,
          storeIsOnline,
          storeRating,
          storeRatingCount,
          storeFollowers,
          storeFollowing,
          avatarUrl: avatarUrlValue,
        },
      });

      await tx.profileChangeRequest.deleteMany({
        where: {
          userId: params.id,
          status: ProfileChangeStatus.PENDING,
          field: { in: ["STORE_NAME", "EMAIL"] },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui pengguna";
    const redirectUrl = new URL("/admin/users", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/admin/users", req.url);
  redirectUrl.searchParams.set("message", "Data seller berhasil diperbarui");
  return NextResponse.redirect(redirectUrl);
}
