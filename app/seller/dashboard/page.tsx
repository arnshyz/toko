import Link from "next/link";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const SELLER_SELECTION = Prisma.validator<Prisma.UserSelect>()({
  isBanned: true,
  storeIsOnline: true,
  name: true,
  slug: true,
  sellerOnboardingStatus: true,
});

type SellerAccount = Prisma.UserGetPayload<{ select: typeof SELLER_SELECTION }> & {
  storeCity: string | null;
  storeProvince: string | null;
  storeAddressLine: string | null;
};

async function getPrimaryWarehouseCity(userId: string): Promise<string | null> {
  const warehouse = await prisma.warehouse.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { city: true },
  });

  return warehouse?.city?.trim() || null;
}

async function getSellerDashboardAccount(userId: string): Promise<SellerAccount | null> {
  try {
    const account = await prisma.user.findUnique({
      where: { id: userId },
      select: SELLER_SELECTION,
    });

    if (!account) {
      return null;
    }

    const warehouseCity = await getPrimaryWarehouseCity(userId);

    return {
      ...account,
      storeCity: warehouseCity,
      storeProvince: null,
      storeAddressLine: null,
    } satisfies SellerAccount;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022" &&
      typeof error.meta?.column === "string" &&
      error.meta.column.startsWith("User.store")
    ) {
      const fallbackAccount = await prisma.$queryRaw<
        Array<{
          isBanned: boolean;
          storeIsOnline: boolean | null;
          name: string;
          slug: string;
          sellerOnboardingStatus: string;
        }>
      >`SELECT "isBanned", "storeIsOnline", "name", "slug", "sellerOnboardingStatus" FROM "User" WHERE "id" = ${userId} LIMIT 1`;

      const row = fallbackAccount[0];
      if (!row) {
        return null;
      }

      const warehouseCity = await getPrimaryWarehouseCity(userId);

      return {
        isBanned: row.isBanned,
        storeIsOnline: row.storeIsOnline ?? false,
        name: row.name,
        slug: row.slug,
        sellerOnboardingStatus: row.sellerOnboardingStatus as SellerAccount['sellerOnboardingStatus'],
        storeCity: warehouseCity,
        storeProvince: null,
        storeAddressLine: null,
      } satisfies SellerAccount;
    }

    throw error;
  }
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login sebagai seller.</div>;

  const account = await getSellerDashboardAccount(user.id);

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard Seller</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Akun seller Anda telah diblokir oleh tim admin karena pelanggaran. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk proses banding atau informasi lebih lanjut.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard Seller</h1>
        <div className="rounded border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
          Akun Anda belum diaktifkan sebagai seller. Ikuti tahapan onboarding dan ajukan aktivasi melalui halaman
          <a className="ml-1 font-semibold text-sky-800 underline" href="/seller/onboarding">
            onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const storeIsOnline = account.storeIsOnline ?? false;
  const storeName = account.name;
  const storeSlug = account.slug;
  const storeCity = account.storeCity?.trim() ?? "";
  const storeProvince = account.storeProvince?.trim() ?? "";
  const storeAddressLine = account.storeAddressLine?.trim() ?? "";
  const hasStoreOrigin = Boolean(storeCity);

  const [
    productCount,
    distinctOrders,
    revenueAggregate,
    pendingItemCount,
    packedItemCount,
    shippedItemCount,
    deliveredItemCount,
    returnRequestCount,
  ] = await Promise.all([
    prisma.product.count({ where: { sellerId: user.id } }),
    prisma.orderItem.findMany({ where: { sellerId: user.id }, select: { orderId: true }, distinct: ["orderId"] }),
    prisma.orderItem.aggregate({ where: { sellerId: user.id, order: { status: 'PAID' } }, _sum: { price: true } }),
    prisma.orderItem.count({ where: { sellerId: user.id, status: "PENDING" } }),
    prisma.orderItem.count({ where: { sellerId: user.id, status: "PACKED" } }),
    prisma.orderItem.count({ where: { sellerId: user.id, status: "SHIPPED" } }),
    prisma.orderItem.count({ where: { sellerId: user.id, status: "DELIVERED" } }),
    prisma.returnRequest.count({ where: { orderItem: { sellerId: user.id }, status: "REQUESTED" } }),
  ]);

  const ordersCount = distinctOrders.length;
  const revenueTotal = revenueAggregate._sum.price ?? 0;

  const sellerOrderSummary = [
    { label: "Perlu Diproses", value: pendingItemCount, icon: "🧾", href: "/seller/orders?status=PENDING" },
    { label: "Dikemas", value: packedItemCount, icon: "📦", href: "/seller/orders?status=PACKED" },
    { label: "Dikirim", value: shippedItemCount, icon: "🚚", href: "/seller/orders?status=SHIPPED" },
    { label: "Selesai", value: deliveredItemCount, icon: "✅", href: "/seller/orders?status=DELIVERED" },
    { label: "Retur", value: returnRequestCount, icon: "↩️", href: "/seller/returns" },
  ];

  const sellerTools = [
    { label: "Produk", icon: "🛒", href: "/seller/products" },
    { label: "Pesanan", icon: "📬", href: "/seller/orders" },
    { label: "Flash Sale", icon: "⚡", href: "/seller/flash-sales" },
    { label: "Gudang", icon: "🏬", href: "/seller/warehouses" },
    { label: "Retur", icon: "↩️", href: "/seller/returns" },
    { label: "Pengaturan", icon: "⚙️", href: "/seller/settings" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4 md:hidden">
        <div className="rounded-3xl bg-gradient-to-br from-[#f53d2d] via-[#ff6f3c] to-[#ff8f59] px-6 py-6 text-white shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-white/70">Dashboard Seller</p>
              <p className="text-2xl font-semibold">{storeName}</p>
              <p className="text-xs text-white/80">https://akay.id/s/{storeSlug}</p>
              {hasStoreOrigin ? (
                <p className="text-xs text-white/80">
                  Gudang: {storeAddressLine ? `${storeAddressLine}, ` : ""}
                  {storeCity}
                  {storeProvince ? `, ${storeProvince}` : ""}
                </p>
              ) : (
                <p className="text-xs text-white/80">
                  Lengkapi alamat gudang untuk aktifkan ongkir otomatis.
                </p>
              )}
            </div>
            <form method="POST" action="/api/seller/store/toggle" className="flex-shrink-0">
              <input type="hidden" name="status" value={storeIsOnline ? "offline" : "online"} />
              <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#f53d2d] shadow">
                {storeIsOnline ? "Tutup Toko" : "Buka Toko"}
              </button>
            </form>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-white/80">
            <Link href={`/s/${storeSlug}`} className="inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white">
              Lihat Toko
            </Link>
            <Link href="/seller/settings" className="text-xs font-semibold underline">
              Pengaturan
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-xs text-gray-500">Produk Aktif</p>
            <p className="text-xl font-semibold text-[#f53d2d]">{productCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-xs text-gray-500">Pesanan Unik</p>
            <p className="text-xl font-semibold text-[#f53d2d]">{ordersCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-xs text-gray-500">Omzet (Paid)</p>
            <p className="text-xl font-semibold text-[#f53d2d]">Rp {new Intl.NumberFormat("id-ID").format(revenueTotal)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-xs text-gray-500">Permintaan Retur</p>
            <p className="text-xl font-semibold text-[#f53d2d]">{returnRequestCount}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Status Pesanan</h2>
            <Link href="/seller/orders" className="text-xs font-semibold text-[#f53d2d]">
              Lihat Semua
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] font-medium text-gray-700">
            {sellerOrderSummary.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3 shadow-sm"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs text-gray-900">{item.label}</span>
                <span className="text-[11px] font-semibold text-[#f53d2d]">{item.value}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Alat Toko</h2>
            <Link href="/seller/settings" className="text-xs font-semibold text-[#f53d2d]">
              Selengkapnya
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-gray-700">
            {sellerTools.map((tool) => (
              <Link
                key={tool.label}
                href={tool.href}
                className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-4 shadow-sm"
              >
                <span className="text-xl">{tool.icon}</span>
                <span>{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden space-y-6 md:block">
        <h1 className="text-2xl font-semibold">Dashboard Seller</h1>
        <div className="flex flex-col gap-4 rounded border bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Profil Toko</h2>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">{storeName}</div>
              <div className="text-xs text-gray-500">Alamat etalase: https://akay.id/s/{storeSlug}</div>
              {hasStoreOrigin ? (
                <div className="mt-1 text-xs text-gray-500">
                  Gudang: {storeAddressLine ? `${storeAddressLine}, ` : ""}
                  {storeCity}
                  {storeProvince ? `, ${storeProvince}` : ""}
                </div>
              ) : (
                <div className="mt-1 text-xs text-sky-600">
                  Tambahkan alamat gudang di pengaturan toko agar ongkos kirim dapat dihitung otomatis.
                </div>
              )}
            </div>
            {hasStoreOrigin ? (
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">Alamat pengiriman toko</div>
                <p>
                  {[storeAddressLine, storeCity, storeProvince]
                    .filter((part) => part && part.length > 0)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <div className="rounded border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
                Lengkapi alamat toko Anda agar ongkir otomatis dapat menggunakan kota asal toko saat produk belum diatur ke
                gudang tertentu.
              </div>
            )}
            <a className="text-sm font-semibold text-[#f53d2d] hover:text-[#d63b22]" href="/seller/settings">
              Atur nama &amp; alamat toko →
            </a>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Status Toko</h2>
            <p className="text-sm text-gray-600">
              {storeIsOnline
                ? "Toko Anda sedang buka dan pelanggan dapat melakukan pembelian."
                : "Toko Anda sedang ditutup. Buka kembali agar pelanggan dapat berbelanja."}
            </p>
          </div>
          <form method="POST" action="/api/seller/store/toggle" className="flex-shrink-0">
            <input type="hidden" name="status" value={storeIsOnline ? "offline" : "online"} />
            <button className={storeIsOnline ? "btn-outline" : "btn-primary"}>
              {storeIsOnline ? "Tutup Toko" : "Buka Toko"}
            </button>
          </form>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded border bg-white p-4">
            <div className="text-sm text-gray-500">Produk</div>
            <div className="text-2xl font-bold">{productCount}</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-sm text-gray-500">Pesanan</div>
            <div className="text-2xl font-bold">{ordersCount}</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-sm text-gray-500">Omzet (Paid)</div>
            <div className="text-2xl font-bold">Rp {new Intl.NumberFormat("id-ID").format(revenueTotal)}</div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 rounded border bg-white p-4">
          {sellerOrderSummary.map((item) => (
            <a key={item.label} href={item.href} className="flex flex-col items-center gap-2 text-sm text-gray-600 hover:text-[#f53d2d]">
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold text-gray-900">{item.value}</span>
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a className="btn-primary" href="/seller/products">Kelola Produk</a>
          <a className="btn-outline" href="/seller/orders">Pesanan Saya</a>
          <a className="btn-outline" href="/seller/warehouses">Gudang</a>
          <a className="btn-outline" href="/seller/returns">Retur</a>
          <a className="btn-outline" href="/seller/flash-sales">Flash Sale</a>
          <a className="btn-outline" href={`/s/${storeSlug}`} target="_blank">Lihat Toko</a>
          <a className="btn-outline" href="/seller/settings">Pengaturan Toko</a>
        </div>
      </div>
    </div>
  );
}
