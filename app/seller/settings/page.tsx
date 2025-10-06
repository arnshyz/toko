import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SellerSettings({ searchParams }: SettingsPageProps) {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    redirect("/seller/login");
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, slug: true, isBanned: true },
  });

  if (!account) {
    redirect("/seller/login");
  }

  if (account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Pengaturan Toko</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun seller Anda telah diblokir oleh tim admin karena pelanggaran. Hubungi{" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>{" "}
          untuk proses banding atau informasi lebih lanjut.
        </div>
      </div>
    );
  }

  const errorMessage = typeof searchParams?.error === "string" ? searchParams?.error : null;
  const successMessage = searchParams?.updated === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pengaturan Toko</h1>
          <p className="text-sm text-gray-600">Atur nama dan tampilan toko agar mudah ditemukan pembeli.</p>
        </div>
        <Link href="/seller/dashboard" className="btn-outline">
          Kembali ke dashboard
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Profil toko berhasil diperbarui.
        </div>
      ) : null}

      <div className="rounded border bg-white p-6 shadow-sm">
        <form method="POST" action="/api/seller/store/profile" className="space-y-4">
          <input type="hidden" name="redirectTo" value="/seller/settings" />
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama toko
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              defaultValue={account.name}
              placeholder="Contoh: Akay Nusantara"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#f53d2d] focus:outline-none focus:ring-2 focus:ring-[#f53d2d]/40"
            />
            <p className="text-xs text-gray-500">Nama toko akan ditampilkan kepada pembeli di halaman etalase Anda.</p>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Alamat etalase</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700">https://akay.id/s/</span>
              <span className="rounded-lg border border-dashed border-gray-300 px-3 py-2 font-mono text-gray-800">{account.slug}</span>
            </div>
            <p className="text-xs text-gray-500">
              Alamat toko akan mengikuti nama toko secara otomatis dan dapat berubah ketika nama diperbarui.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-primary" type="submit">
              Simpan perubahan
            </button>
            <span className="text-xs text-gray-500">Perubahan dapat memerlukan waktu beberapa menit untuk muncul di hasil pencarian.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
