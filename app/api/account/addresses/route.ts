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
  const provinceIdRaw = form.get("provinceId");
  const cityRaw = form.get("city");
  const cityIdRaw = form.get("cityId");
  const districtRaw = form.get("district");
  const districtIdRaw = form.get("districtId");
  const addressLineRaw = form.get("addressLine");
  const additionalRaw = form.get("additionalInfo");

  const fullName = typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";
  const phoneNumber = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  const province = typeof provinceRaw === "string" ? provinceRaw.trim() : "";
  const provinceId = typeof provinceIdRaw === "string" ? provinceIdRaw.trim() : "";
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";
  const cityId = typeof cityIdRaw === "string" ? cityIdRaw.trim() : "";
  const district = typeof districtRaw === "string" ? districtRaw.trim() : "";
  const districtId = typeof districtIdRaw === "string" ? districtIdRaw.trim() : "";
  const addressLine = typeof addressLineRaw === "string" ? addressLineRaw.trim() : "";
  const additionalInfo = typeof additionalRaw === "string" ? additionalRaw.trim() : "";

  const requiredFields: [string, string][] = [
    ["Nama Lengkap", fullName],
    ["Nomor telepon", phoneNumber],
    ["Provinsi", province],
    ["ID provinsi", provinceId],
    ["Kota", city],
    ["ID kota", cityId],
    ["Kecamatan", district],
    ["ID kecamatan", districtId],
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

  if (phoneNumber && !/^\+?\d{6,15}$/.test(phoneNumber)) {
    redirectUrl.searchParams.set("addressError", "Nomor telepon tidak valid.");
    redirectUrl.searchParams.delete("addressAdded");
    return NextResponse.redirect(redirectUrl);
  }

  const numericIdPattern = /^\d+$/;
  if (!numericIdPattern.test(provinceId) || !numericIdPattern.test(cityId) || !numericIdPattern.test(districtId)) {
    redirectUrl.searchParams.set(
      "addressError",
      "Pilihan wilayah tidak valid. Silakan pilih ulang provinsi, kota, dan kecamatan.",
    );
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
        provinceId,
        city,
        cityId,
        district,
        districtId,
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
