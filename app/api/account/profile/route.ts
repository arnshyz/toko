import { NextRequest, NextResponse } from "next/server";
import { ProfileChangeField, ProfileChangeStatus } from "@prisma/client";
import { getIronSession } from "iron-session";

import { prisma } from "@/lib/prisma";
import { sessionOptions, SessionUser } from "@/lib/session";

function normalizeEmail(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.toLowerCase();
}

function normalizeText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<{ user?: SessionUser }>(req, res, sessionOptions);
  const sessionUser = session.user;

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = normalizeText(formData.get("name"));
  const storeName = normalizeText(formData.get("storeName"));
  const email = normalizeEmail(formData.get("email"));

  const buildRedirect = (message: string, type: "success" | "error") => {
    const url = new URL("/seller/dashboard", req.url);
    url.searchParams.set(type === "success" ? "message" : "error", message);
    const redirectResponse = NextResponse.redirect(url);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  };

  if (!name) {
    return buildRedirect("Nama tidak boleh kosong", "error");
  }
  if (!storeName) {
    return buildRedirect("Nama toko tidak boleh kosong", "error");
  }
  if (!email) {
    return buildRedirect("Email tidak boleh kosong", "error");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      profileChangeRequests: {
        where: { status: ProfileChangeStatus.PENDING },
      },
    },
  });

  if (!user) {
    return buildRedirect("Akun tidak ditemukan", "error");
  }

  const actions: (() => Promise<void>)[] = [];

  if (user.name !== name) {
    actions.push(async () => {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
      session.user = { ...sessionUser, name };
      await session.save();
    });
  }

  const activeStoreName = user.storeName?.trim().length ? user.storeName : user.name;
  if (storeName !== activeStoreName) {
    const existing = user.profileChangeRequests.find(
      (req) => req.field === ProfileChangeField.STORE_NAME,
    );
    actions.push(async () => {
      if (existing) {
        await prisma.profileChangeRequest.update({
          where: { id: existing.id },
          data: { newValue: storeName, createdAt: new Date() },
        });
      } else {
        await prisma.profileChangeRequest.create({
          data: {
            userId: user.id,
            field: ProfileChangeField.STORE_NAME,
            newValue: storeName,
          },
        });
      }
    });
  }

  if (email !== user.email) {
    const existing = user.profileChangeRequests.find((req) => req.field === ProfileChangeField.EMAIL);
    actions.push(async () => {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate && duplicate.id !== user.id) {
        throw new Error("Email sudah digunakan pengguna lain");
      }
      if (existing) {
        await prisma.profileChangeRequest.update({
          where: { id: existing.id },
          data: { newValue: email, createdAt: new Date() },
        });
      } else {
        await prisma.profileChangeRequest.create({
          data: {
            userId: user.id,
            field: ProfileChangeField.EMAIL,
            newValue: email,
          },
        });
      }
    });
  }

  if (actions.length === 0) {
    return buildRedirect("Tidak ada perubahan yang disimpan", "success");
  }

  try {
    for (const action of actions) {
      await action();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan perubahan";
    return buildRedirect(message, "error");
  }

  return buildRedirect("Perubahan profil berhasil diajukan", "success");
}
