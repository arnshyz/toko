import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

function resolveRedirect(redirectTo: FormDataEntryValue | null, reqUrl: string, fallback: string) {
  const base = new URL(reqUrl);
  if (typeof redirectTo !== "string" || redirectTo.trim().length === 0) {
    return new URL(fallback, base);
  }

  try {
    const target = new URL(redirectTo, base);
    if (target.origin !== base.origin) {
      return new URL(fallback, base);
    }
    return target;
  } catch {
    return new URL(fallback, base);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const actor = session.user;

  const form = await req.formData();
  const redirectUrl = resolveRedirect(form.get("redirectTo"), req.url, "/account");

  if (!actor) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  const fullNameRaw = form.get("fullName");
  const phoneRaw = form.get("phoneNumber");
  const provinceRaw = form.get("province");
  const cityRaw = form.get("city");
  const districtRaw = form.get("district");
  const postalCodeRaw = form.get("postalCode");
  const addressLineRaw = form.get("addressLine");
  const additionalRaw = form.get("additionalInfo");

  const fullName = typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";
  const phoneNumber = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  const province = typeof provinceRaw === "string" ? provinceRaw.trim() : "";
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";
  const district = typeof districtRaw === "string" ? districtRaw.trim() : "";
  const postalCode = typeof postalCodeRaw === "string" ? postalCodeRaw.trim() : "";
  const addressLine = typeof addressLineRaw === "string" ? addressLineRaw.trim() : "";
  const additionalInfo = typeof additionalRaw === "string" ? additionalRaw.trim() : "";

  const requiredFields: [string, string][] = [
    ["Nama Lengkap", fullName],
    ["Nomor telepon", phoneNumber],
    ["Provinsi", province],
    ["Kota", city],
    ["Kecamatan", district],
    ["Kode pos", postalCode],
    ["Alamat lengkap", addressLine],
  ];

  for (const [label, value] of requiredFields) {
    if (!value) {
      redirectUrl.searchParams.set(
        "addressError",
        `${label} wajib diisi.`,
      );
      redirectUrl.searchParams.delete("addressAdded");
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (!/^\d{4,10}$/.test(postalCode)) {
    redirectUrl.searchParams.set("addressError", "Kode pos harus berupa 4-10 digit angka.");
    redirectUrl.searchParams.delete("addressAdded");
    return NextResponse.redirect(redirectUrl);
  }

  if (phoneNumber && !/^\+?\d{6,15}$/.test(phoneNumber)) {
    redirectUrl.searchParams.set("addressError", "Nomor telepon tidak valid.");
    redirectUrl.searchParams.delete("addressAdded");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await prisma.userAddress.create({
      data: {
        userId: actor.id,
        fullName,
        phoneNumber,
        province,
        city,
        district,
        postalCode,
        addressLine,
        additionalInfo: additionalInfo || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan alamat.";
    redirectUrl.searchParams.set("addressError", message);
    redirectUrl.searchParams.delete("addressAdded");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.delete("addressError");
  redirectUrl.searchParams.set("addressAdded", "1");

  return NextResponse.redirect(redirectUrl);
}
