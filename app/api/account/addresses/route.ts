import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

import { parseAddressForm, resolveRedirect } from "./utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const actor = session.user;

  const form = await req.formData();
  const redirectUrl = resolveRedirect(form.get("redirectTo"), req.url, "/account");

  if (!actor) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  const parsed = parseAddressForm(form);

  if (!parsed.success) {
    redirectUrl.searchParams.set("addressError", parsed.error);
    redirectUrl.searchParams.delete("addressAdded");
    redirectUrl.searchParams.delete("addressUpdated");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await prisma.userAddress.create({
      data: {
        userId: actor.id,
        ...parsed.data,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan alamat.";
    redirectUrl.searchParams.set("addressError", message);
    redirectUrl.searchParams.delete("addressAdded");
    redirectUrl.searchParams.delete("addressUpdated");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.delete("addressError");
  redirectUrl.searchParams.set("addressAdded", "1");
  redirectUrl.searchParams.delete("addressUpdated");
  redirectUrl.searchParams.delete("editAddress");

  return NextResponse.redirect(redirectUrl);
}
