import Link from "next/link";
import { OrderStatus, SellerOnboardingStatus } from "@prisma/client";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

type ChartPoint = {
  key: string;
  label: string;
  sales: number;
  orders: number;
};

function SalesBarChart({ data }: { data: ChartPoint[] }) {
  const maxSales = Math.max(...data.map((point) => point.sales), 0);
  const totalOrders = data.reduce((acc, point) => acc + point.orders, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-48 items-end gap-4">
        {data.map((point) => {
          const baseHeight = maxSales > 0 ? (point.sales / maxSales) * 100 : 0;
          const heightPercent = maxSales > 0
            ? Math.max(point.sales > 0 ? 12 : 0, baseHeight)
            : 0;
          const clampedHeight = Math.min(heightPercent, 100);

          return (
            <div
              key={point.key}
              className="flex flex-1 flex-col items-center gap-3 text-center"
            >
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 shadow-sm transition-all"
                  style={{ height: `${clampedHeight}%`, opacity: point.sales === 0 ? 0.2 : 1 }}
                  aria-label={`Penjualan ${point.label} sebesar ${formatCurrency(point.sales)}`}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-900">
                  {formatCurrency(point.sales)}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  {point.label}
                </p>
                <p className="text-[11px] text-gray-500">
                  {formatNumber(point.orders)} pesanan
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {totalOrders > 0 ? (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Pesanan bulanan</span>
          <span>Total {formatNumber(totalOrders)} pesanan</span>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          Belum ada pesanan pada periode ini.
        </p>
      )}
    </div>
  );
}

const adminActions = [
  {
    href: "/admin/settings",
    title: "Pengaturan Website",
    description: "Atur nama, deskripsi, dan logo agar identitas toko selalu konsisten.",
    icon: "⚙️",
    accent: "from-violet-500 via-indigo-500 to-blue-500",
  },
  {
    href: "/admin/users",
    title: "Pengguna & Seller",
    description: "Kelola akun pengguna, atur peran admin, dan pantau status seller.",
    icon: "👥",
    accent: "from-sky-500 via-cyan-500 to-emerald-400",
  },
  {
    href: "/admin/products",
    title: "Produk",
    description: "Kurasi katalog produk, kelola stok, dan moderasi listing seller.",
    icon: "🛒",
    accent: "from-fuchsia-500 via-purple-500 to-indigo-500",
  },
  {
    href: "/admin/couriers",
    title: "Kurir & Pengiriman",
    description: "Tambahkan jasa pengiriman baru atau nonaktifkan kurir yang tidak aktif.",
    icon: "🚚",
    accent: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    href: "/admin/categories",
    title: "Kategori Produk",
    description: "Bangun struktur kategori yang rapi agar pelanggan mudah menjelajah.",
    icon: "🗂️",
    accent: "from-lime-500 via-emerald-500 to-teal-500",
  },
  {
    href: "/admin/banners",
    title: "Banner & Kampanye",
    description: "Kelola banner promosi dan tampilkan kampanye penting di halaman utama.",
    icon: "📢",
    accent: "from-indigo-500 via-blue-500 to-sky-500",
  },
  {
    href: "/admin/vouchers",
    title: "Voucher",
    description: "Susun kode promo baru, tetapkan kuota, dan pantau performa voucher.",
    icon: "🎟️",
    accent: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
  {
    href: "/admin/orders",
    title: "Pesanan",
    description: "Pantau seluruh transaksi, verifikasi pembayaran, dan tindaklanjuti kendala.",
    icon: "📦",
    accent: "from-slate-500 via-gray-500 to-neutral-500",
  },
] as const;

export default async function AdminHomePage() {
  const session = await getSession();
  const currentUser = session.user;

  if (!currentUser || !currentUser.isAdmin) {
    return <div>Admin only.</div>;
  }

  const [
    totalUsers,
    activeSellers,
    totalOrders,
    orderAggregate,
    quantityAggregate,
    activeCategories,
    activeCouriers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { sellerOnboardingStatus: SellerOnboardingStatus.ACTIVE },
    }),
    prisma.order.count({
      where: { status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.order.aggregate({
      where: { status: { not: OrderStatus.CANCELLED } },
      _sum: { itemsTotal: true, voucherDiscount: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { status: { not: OrderStatus.CANCELLED } } },
      _sum: { qty: true },
    }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.courier.count({ where: { isActive: true } }),
  ]);

  const totalSales = Math.max(
    0,
    (orderAggregate._sum.itemsTotal ?? 0) - (orderAggregate._sum.voucherDiscount ?? 0),
  );
  const totalQuantity = quantityAggregate._sum.qty ?? 0;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  const monthsToDisplay = 6;
  const now = new Date();
  const chartStart = new Date(now.getFullYear(), now.getMonth() - (monthsToDisplay - 1), 1);

  const ordersForChart = await prisma.order.findMany({
    where: {
      status: { not: OrderStatus.CANCELLED },
      createdAt: { gte: chartStart },
    },
    select: { createdAt: true, itemsTotal: true, voucherDiscount: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyBuckets = Array.from({ length: monthsToDisplay }, (_, index) => {
    const monthDate = new Date(chartStart.getFullYear(), chartStart.getMonth() + index, 1);
    const label = monthDate.toLocaleDateString("id-ID", { month: "short" });
    const labelWithYear = `${label} ${monthDate.getFullYear().toString().slice(-2)}`;
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

    return { key, label: labelWithYear };
  });

  const monthlyMap = new Map(
    monthlyBuckets.map((bucket) => [bucket.key, { sales: 0, orders: 0 }]),
  );

  for (const order of ordersForChart) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    const target = monthlyMap.get(key);
    if (!target) continue;

    target.sales += order.itemsTotal - (order.voucherDiscount ?? 0);
    target.orders += 1;
  }

  const chartData: ChartPoint[] = monthlyBuckets.map((bucket) => {
    const stats = monthlyMap.get(bucket.key)!;
    return {
      key: bucket.key,
      label: bucket.label,
      sales: stats.sales,
      orders: stats.orders,
    };
  });

  const overviewCards = [
    {
      label: "Penjualan semua user",
      value: formatCurrency(totalSales),
      helper: "Total pendapatan bersih dari pesanan aktif.",
      icon: "💰",
    },
    {
      label: "Produk terjual (QTY)",
      value: formatNumber(totalQuantity),
      helper: "Akumulasi kuantitas item di pesanan non-cancelled.",
      icon: "📦",
    },
    {
      label: "Total pengguna",
      value: formatNumber(totalUsers),
      helper: "Termasuk semua pembeli dan seller terdaftar.",
      icon: "🙋",
    },
    {
      label: "Seller aktif",
      value: formatNumber(activeSellers),
      helper: "Seller dengan status onboarding aktif.",
      icon: "🛍️",
    },
    {
      label: "Total pesanan",
      value: formatNumber(totalOrders),
      helper: "Pesanan yang belum dibatalkan.",
      icon: "🧾",
    },
    {
      label: "Kategori aktif",
      value: formatNumber(activeCategories),
      helper: "Kategori yang dapat dipilih seller.",
      icon: "🗂️",
    },
    {
      label: "Kurir aktif",
      value: formatNumber(activeCouriers),
      helper: "Metode pengiriman tersedia di checkout.",
      icon: "🚚",
    },
    {
      label: "Rata-rata nilai pesanan",
      value: formatCurrency(averageOrderValue),
      helper: "Perhitungan berdasarkan total pesanan aktif.",
      icon: "📈",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-10 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Panel Admin Toko
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Satu tempat untuk mengatur seluruh operasional marketplace Anda
          </h1>
          <p className="text-sm text-white/70">
            Pilih modul administrasi di bawah untuk mulai mengelola pengguna, produk, pengiriman, promosi, dan pesanan secara terpadu.
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article
            key={card.label}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
              <span className="text-3xl" aria-hidden>
                {card.icon}
              </span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-gray-500">{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Performa penjualan 6 bulan terakhir
            </h2>
            <p className="text-sm text-gray-500">
              Data mencakup semua pesanan aktif dan menunggu pembayaran, tidak termasuk pesanan dibatalkan.
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
            Terakhir diperbarui {now.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
        <div className="mt-6">
          <SalesBarChart data={chartData} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-br ${action.accent} opacity-0 transition duration-200 group-hover:opacity-10`}
            />
            <div className="relative flex flex-col gap-6">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl transition duration-200 group-hover:scale-105">
                {action.icon}
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">{action.title}</h2>
                <p className="text-sm leading-relaxed text-gray-600">{action.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 transition duration-200 group-hover:gap-3">
                Kelola sekarang
                <span aria-hidden>→</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
