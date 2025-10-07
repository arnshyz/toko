import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const redirectToRaw = formData.get("redirectTo");
  const addressLineRaw = formData.get("addressLine");
  const provinceRaw = formData.get("province");
  const cityRaw = formData.get("city");
  const districtRaw = formData.get("district");
  const postalCodeRaw = formData.get("postalCode");
  const originCityIdRaw = formData.get("originCityId");

  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const user = session.user;

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(typeof redirectToRaw === "string" ? redirectToRaw : "/seller/settings", req.url);
  } catch {
    redirectUrl = new URL("/seller/settings", req.url);
  }

  if (redirectUrl.origin !== new URL(req.url).origin) {
    redirectUrl = new URL("/seller/settings", req.url);
  }

  if (!user) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  const province = typeof provinceRaw === "string" ? provinceRaw.trim() : "";
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";
  const district = typeof districtRaw === "string" ? districtRaw.trim() : "";
  const postalCode = typeof postalCodeRaw === "string" ? postalCodeRaw.trim() : "";
  const addressLine = typeof addressLineRaw === "string" ? addressLineRaw.trim() : "";
  const originCityId = typeof originCityIdRaw === "string" ? originCityIdRaw.trim() : "";

  if (!province || !city) {
    redirectUrl.searchParams.set(
      "addressError",
      "Provinsi dan kota asal wajib diisi untuk menghitung ongkir otomatis.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account) {
    redirectUrl.searchParams.set("addressError", "Akun tidak ditemukan.");
    return NextResponse.redirect(redirectUrl);
  }

  if (account.isBanned) {
    return NextResponse.redirect(new URL("/seller/login?error=banned", req.url));
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    redirectUrl.searchParams.set(
      "addressError",
      "Aktifkan toko Anda melalui onboarding sebelum mengubah alamat toko.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      storeAddressLine: addressLine || null,
      storeProvince: province,
      storeCity: city,
      storeDistrict: district || null,
      storePostalCode: postalCode || null,
      storeOriginCityId: originCityId || null,
    },
  });

  redirectUrl.searchParams.delete("addressError");
  redirectUrl.searchParams.set("addressUpdated", "1");

  const response = NextResponse.redirect(redirectUrl);

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      response.headers.append(key, value);
    }
  });

  return response;
}
