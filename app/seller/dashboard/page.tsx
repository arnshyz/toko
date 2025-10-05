import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type DashboardProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getMessage(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return {} as { success?: string; error?: string };
  const successParam = searchParams.message;
  const errorParam = searchParams.error;
  const success = Array.isArray(successParam) ? successParam[0] : successParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  return {
    success,
    error,
  };
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const session = await getSession();
  const sessionUser = session.user;
  if (!sessionUser) {
    return (
      <div className="rounded border border-orange-200 bg-orange-50 p-6 text-center text-sm text-orange-700">
        Harap login sebagai seller untuk mengelola akun Anda.
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      profileChangeRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Data akun tidak ditemukan.
      </div>
    );
  }

  const pendingStoreName = user.profileChangeRequests.find((req) => req.field === "STORE_NAME");
  const pendingEmail = user.profileChangeRequests.find((req) => req.field === "EMAIL");
  const currentStoreName = user.storeName?.trim().length ? user.storeName : user.name;
  const storeNameInputValue = pendingStoreName?.newValue ?? currentStoreName ?? "";
  const emailInputValue = pendingEmail?.newValue ?? user.email ?? "";

  const { success, error } = getMessage(searchParams);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[240px,1fr]">
      <aside className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Akun Saya</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola informasi penting untuk melindungi dan mengamankan akun Anda.
          </p>
        </div>
        <nav className="hidden flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-600 lg:flex">
          <span className="rounded-md bg-orange-500/10 px-3 py-2 text-orange-600">Profil</span>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-50" href="/seller/orders">
            Pesanan Saya
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-50" href="/seller/products">
            Produk
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-50" href="/seller/warehouses">
            Gudang &amp; Pengiriman
          </Link>
        </nav>
      </aside>

      <section className="space-y-6">
        {(success || error) && (
          <div
            className={`rounded border px-4 py-3 text-sm ${
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {success ?? error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Profil Saya</h2>
            <p className="mt-1 text-sm text-gray-500">
              Pastikan data akun selalu terbaru untuk pengalaman belanja yang optimal.
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col items-center gap-4 text-center lg:w-56 lg:text-left">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatarUrl?.trim() ? user.avatarUrl : "https://placehold.co/120x120?text=AK"}
                    alt={user.name ?? "Foto profil"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <form
                  className="flex w-full flex-col items-center gap-3 text-sm lg:items-stretch"
                  action="/api/account/avatar"
                  method="POST"
                  encType="multipart/form-data"
                >
                  <label
                    htmlFor="avatar"
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:border-orange-400 hover:text-orange-600"
                  >
                    Pilih Gambar
                  </label>
                  <input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-md bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600"
                  >
                    Simpan Foto
                  </button>
                  <p className="text-xs text-gray-500">Ukuran gambar maks. 1 MB (format .jpg, .png, .webp).</p>
                </form>
              </div>

              <div className="flex-1">
                <form action="/api/account/profile" method="POST" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Nama Pemilik</span>
                      <input
                        type="text"
                        name="name"
                        defaultValue={user.name ?? ""}
                        required
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      />
                      <span className="text-xs text-gray-500">
                        Nama ini digunakan untuk komunikasi internal dan tidak perlu persetujuan admin.
                      </span>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Nama Toko</span>
                      <input
                        type="text"
                        name="storeName"
                        defaultValue={storeNameInputValue}
                        required
                        className={`rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                          pendingStoreName
                            ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200"
                            : "border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {pendingStoreName
                          ? "Menunggu persetujuan admin. Anda dapat memperbarui permintaan bila perlu."
                          : "Perubahan nama toko memerlukan persetujuan admin."}
                      </span>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Email</span>
                      <input
                        type="email"
                        name="email"
                        defaultValue={emailInputValue}
                        required
                        className={`rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                          pendingEmail
                            ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200"
                            : "border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {pendingEmail
                          ? "Perubahan email sedang menunggu persetujuan admin."
                          : "Perubahan email akan diverifikasi terlebih dahulu oleh admin."}
                      </span>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Slug Toko</span>
                      <input
                        type="text"
                        name="slug"
                        defaultValue={user.slug ?? ""}
                        disabled
                        className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                      />
                      <span className="text-xs text-gray-500">Hubungi admin bila Anda perlu mengubah tautan toko.</span>
                    </label>
                  </div>
                  <div className="flex flex-col gap-3 rounded-md bg-orange-50 px-4 py-3 text-sm text-orange-700">
                    <div>
                      Nama toko aktif saat ini:
                      <span className="ml-1 font-semibold text-orange-600">{currentStoreName}</span>
                    </div>
                    <div>Email aktif: <span className="font-semibold text-orange-600">{user.email}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                      href={`/s/${user.slug}`}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-orange-400 hover:text-orange-600"
                    >
                      Lihat Halaman Toko
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          <h3 className="text-base font-semibold text-gray-800">Butuh bantuan?</h3>
          <p className="mt-2">
            Jika Anda memiliki kendala terkait perubahan data akun, hubungi tim admin melalui menu Bantuan atau email
            <a className="ml-1 font-medium text-orange-600 hover:underline" href="mailto:support@akay.id">
              support@akay.id
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
