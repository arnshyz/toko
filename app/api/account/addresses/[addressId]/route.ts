import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

import { parseAddressForm, resolveRedirect } from "../utils";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    addressId: string;
  };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  const actor = session.user;
  const addressId = params.addressId;

  const form = await req.formData();
  const redirectUrl = resolveRedirect(form.get("redirectTo"), req.url, "/account");

  if (!actor) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  if (!addressId) {
    redirectUrl.searchParams.set("addressError", "Alamat tidak ditemukan.");
    redirectUrl.searchParams.delete("addressAdded");
    redirectUrl.searchParams.delete("addressUpdated");
    redirectUrl.searchParams.delete("editAddress");
    return NextResponse.redirect(redirectUrl);
  }

  const parsed = parseAddressForm(form);

  if (!parsed.success) {
    redirectUrl.searchParams.set("addressError", parsed.error);
    redirectUrl.searchParams.delete("addressAdded");
    redirectUrl.searchParams.delete("addressUpdated");
    redirectUrl.searchParams.set("editAddress", addressId);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const target = await prisma.userAddress.findUnique({
      where: { id: addressId },
      select: { id: true, userId: true },
    });

    if (!target || target.userId !== actor.id) {
      redirectUrl.searchParams.set("addressError", "Alamat tidak ditemukan.");
      redirectUrl.searchParams.delete("addressAdded");
      redirectUrl.searchParams.delete("addressUpdated");
      redirectUrl.searchParams.delete("editAddress");
      return NextResponse.redirect(redirectUrl);
    }

    await prisma.userAddress.update({
      where: { id: addressId },
      data: parsed.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui alamat.";
    redirectUrl.searchParams.set("addressError", message);
    redirectUrl.searchParams.delete("addressAdded");
    redirectUrl.searchParams.delete("addressUpdated");
    redirectUrl.searchParams.set("editAddress", addressId);
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.delete("addressError");
  redirectUrl.searchParams.delete("addressAdded");
  redirectUrl.searchParams.set("addressUpdated", "1");
  redirectUrl.searchParams.delete("editAddress");

  return NextResponse.redirect(redirectUrl);
}
