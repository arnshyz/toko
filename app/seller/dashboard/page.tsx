import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login sebagai seller.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      isBanned: true,
      storeIsOnline: true,
      name: true,
      slug: true,
      sellerOnboardingStatus: true,
      storeCity: true,
      storeProvince: true,
      storeAddressLine: true,
    },
  });

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
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Akun Anda belum diaktifkan sebagai seller. Ikuti tahapan onboarding dan ajukan aktivasi melalui halaman
          <a className="ml-1 font-semibold text-amber-800 underline" href="/seller/onboarding">
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

  const [pcount, orders, revenue] = await Promise.all([
    prisma.product.count({ where: { sellerId: user.id } }),
    prisma.orderItem.findMany({ where: { sellerId: user.id }, select: { orderId: true }, distinct: ["orderId"] }),
    prisma.orderItem.aggregate({ where: { sellerId: user.id, order: { status: 'PAID' } }, _sum: { price: true } })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Seller</h1>
      <div className="bg-white border rounded p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-lg">Profil Toko</h2>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">{storeName}</div>
              <div className="text-xs text-gray-500">Alamat etalase: https://akay.id/s/{storeSlug}</div>
            </div>
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
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Lengkapi alamat toko Anda agar ongkir otomatis dapat menggunakan kota asal toko saat produk belum diatur ke
              gudang tertentu.
            </div>
          )}
          <a className="text-sm font-semibold text-[#f53d2d] hover:text-[#d63b22]" href="/seller/settings">
            Atur nama &amp; alamat toko →
          </a>
        </div>
        <div>
          <h2 className="font-semibold text-lg">Status Toko</h2>
          <p className="text-sm text-gray-600">
            {storeIsOnline
              ? "Toko Anda sedang buka dan pelanggan dapat melakukan pembelian."
              : "Toko Anda sedang ditutup. Buka kembali agar pelanggan dapat berbelanja."}
          </p>
        </div>
        <form method="POST" action="/api/seller/store/toggle" className="flex-shrink-0">
          <input
            type="hidden"
            name="status"
            value={storeIsOnline ? "offline" : "online"}
          />
          <button className={storeIsOnline ? "btn-outline" : "btn-primary"}>
            {storeIsOnline ? "Tutup Toko" : "Buka Toko"}
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Produk</div><div className="text-2xl font-bold">{pcount}</div></div>
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Pesanan</div><div className="text-2xl font-bold">{orders.length}</div></div>
        <div className="bg-white border rounded p-4"><div className="text-sm text-gray-500">Omzet (Paid)</div><div className="text-2xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(revenue._sum.price || 0)}</div></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <a className="btn-primary" href="/seller/products">Kelola Produk</a>
        <a className="btn-outline" href="/seller/orders">Pesanan Saya</a>
        <a className="btn-outline" href="/seller/warehouses">Gudang</a>
        <a className="btn-outline" href="/seller/returns">Retur</a>
        <a className="btn-outline" href="/seller/flash-sales">Flash Sale</a>
        <a className="btn-outline" href={`/s/${storeSlug}`} target="_blank">Lihat Toko</a>
        <a className="btn-outline" href="/seller/settings">Pengaturan Toko</a>
      </div>
    </div>
  );
}
