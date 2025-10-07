import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  const viewer = session.user;

  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: {
      name: true,
      email: true,
      phoneNumber: true,
      addresses: {
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          province: true,
          provinceId: true,
          city: true,
          cityId: true,
          district: true,
          districtId: true,
          postalCode: true,
          addressLine: true,
          additionalInfo: true,
          isDefault: true,
          createdAt: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const defaultAddress =
    account.addresses.find((address) => address.isDefault) ?? account.addresses[0] ?? null;

  return NextResponse.json({
    profile: {
      name: account.name,
      email: account.email,
      phoneNumber: account.phoneNumber,
    },
    defaultAddress,
    addressesCount: account.addresses.length,
  });
}
