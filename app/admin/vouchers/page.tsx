import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const iso = value.toISOString();
  return iso.slice(0, 16);
}

export default async function AdminVouchersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const currentUser = session.user;

  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const voucherKinds = ["PERCENT", "FIXED"] as const;

  let vouchers: Awaited<ReturnType<typeof prisma.voucher.findMany>> = [];
  let loadError: string | undefined;
  try {
    vouchers = await prisma.voucher.findMany({
      orderBy: [{ createdAt: "desc" }, { code: "asc" }],
    });
  } catch (error) {
    console.error("Failed to load vouchers", error);
    loadError = "Tidak dapat memuat data voucher. Silakan coba lagi.";
  }

  const successMessage =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const errorMessage =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin: Kelola Voucher Publik</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="link" href="/admin/users">
            Manajemen Pengguna
          </Link>
          <Link className="link" href="/admin/products">
            Kelola Produk
          </Link>
          <Link className="link" href="/admin/banners">
            Kelola Banner Promo
          </Link>
          <Link className="link" href="/admin/orders">
            Pantau Pesanan
          </Link>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold">Tambah Voucher Baru</h2>
        <p className="mt-1 text-sm text-gray-500">
          Voucher aktif akan dapat digunakan oleh pembeli di halaman checkout publik.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" method="POST" action="/api/admin/vouchers/create">
          <label className="flex flex-col text-sm">
            <span className="font-medium">Kode Voucher</span>
            <input
              className="rounded border px-3 py-2 uppercase"
              name="code"
              placeholder="contoh: AKAY20"
              required
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Jenis</span>
            <select className="rounded border px-3 py-2" name="kind" defaultValue="PERCENT">
              {voucherKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind === "PERCENT" ? "Persentase" : "Potongan Tetap"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Nilai</span>
            <input
              className="rounded border px-3 py-2"
              type="number"
              name="value"
              min="1"
              placeholder="Contoh: 10"
              required
            />
            <span className="mt-1 text-xs text-gray-500">
              Jika jenis Persentase, masukkan nilai 1-100. Jika jenis Tetap, isi nominal rupiah.
            </span>
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Minimal Belanja</span>
            <input
              className="rounded border px-3 py-2"
              type="number"
              name="minSpend"
              min="0"
              defaultValue={0}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Berlaku Hingga</span>
            <input className="rounded border px-3 py-2" type="datetime-local" name="expiresAt" />
            <span className="mt-1 text-xs text-gray-500">
              Kosongkan bila voucher tidak memiliki tanggal kedaluwarsa.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input className="h-4 w-4" type="checkbox" name="active" defaultChecked />
            <span>Aktifkan voucher ini</span>
          </label>
          <div className="md:col-span-2">
            <button className="btn-outline" type="submit">
              Simpan Voucher
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Voucher</h2>
        {loadError ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Belum ada voucher yang tersimpan.
          </div>
        ) : (
          <div className="grid gap-4">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="rounded border bg-white p-4 shadow-sm">
                <form
                  className="grid gap-4 md:grid-cols-2"
                  method="POST"
                  action={`/api/admin/vouchers/${voucher.id}/update`}
                >
                  <label className="flex flex-col text-sm">
                    <span className="font-medium">Kode Voucher</span>
                    <input
                      className="rounded border px-3 py-2 uppercase"
                      name="code"
                      defaultValue={voucher.code}
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="font-medium">Jenis</span>
                    <select className="rounded border px-3 py-2" name="kind" defaultValue={voucher.kind}>
                      {voucherKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind === "PERCENT" ? "Persentase" : "Potongan Tetap"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="font-medium">Nilai</span>
                    <input
                      className="rounded border px-3 py-2"
                      type="number"
                      name="value"
                      min="1"
                      defaultValue={voucher.value}
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="font-medium">Minimal Belanja</span>
                    <input
                      className="rounded border px-3 py-2"
                      type="number"
                      name="minSpend"
                      min="0"
                      defaultValue={voucher.minSpend}
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="font-medium">Berlaku Hingga</span>
                    <input
                      className="rounded border px-3 py-2"
                      type="datetime-local"
                      name="expiresAt"
                      defaultValue={toDateTimeLocal(voucher.expiresAt)}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input className="h-4 w-4" type="checkbox" name="active" defaultChecked={voucher.active} />
                    <span>Voucher aktif</span>
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button className="btn-outline" type="submit">
                      Perbarui Voucher
                    </button>
                    <span className="text-xs text-gray-500">
                      Dibuat: {voucher.createdAt.toLocaleString("id-ID")}
                    </span>
                    {voucher.expiresAt ? (
                      <span className="text-xs text-gray-500">
                        Berlaku hingga: {voucher.expiresAt.toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Tanpa kedaluwarsa</span>
                    )}
                  </div>
                </form>
                <form
                  className="mt-3 inline-block"
                  method="POST"
                  action={`/api/admin/vouchers/${voucher.id}/delete`}
                >
                  <button
                    className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    type="submit"
                  >
                    Hapus Voucher
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
