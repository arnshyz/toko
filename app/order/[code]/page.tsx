import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { OrderHistoryRecorder } from "@/components/OrderHistoryRecorder";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Menunggu Pembayaran", className: "bg-amber-100 text-amber-700" },
  PAID: { label: "Sudah Dibayar", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700" },
};

const PAYMENT_LABELS: Record<string, string> = {
  TRANSFER: "Transfer Manual",
  COD: "Bayar di Tempat (COD)",
};

const PRODUCT_PLACEHOLDER = "https://placehold.co/96x96?text=Produk";

function formatCurrency(value: number) {
  return `Rp ${formatIDR(value)}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default async function OrderDetailPage({ params }: { params: { code: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderCode: params.code },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              seller: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
        Pesanan tidak ditemukan. Pastikan kode pesanan benar atau hubungi layanan pelanggan kami.
      </div>
    );
  }

  const statusInfo = STATUS_STYLES[order.status] ?? {
    label: order.status,
    className: "bg-gray-100 text-gray-600",
  };
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const voucherActive = order.voucherDiscount > 0;
  const uniqueCodeActive = order.paymentMethod === "TRANSFER" && order.uniqueCode > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <OrderHistoryRecorder orderCode={order.orderCode} />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pesanan {order.orderCode}</h1>
            <p className="text-sm text-gray-600">Dibuat pada {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
            <p className="mt-2 text-sm font-semibold text-gray-900">{paymentLabel}</p>
            <p className="text-xs text-gray-500">Kurir: {order.courier}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Detail Penerima</h2>
            <p className="text-sm font-medium text-gray-900">{order.buyerName}</p>
            <p className="text-xs text-gray-600">{order.buyerPhone}</p>
            <p className="text-sm text-gray-600">{order.buyerAddress}</p>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Ringkasan Pembayaran</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total barang</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.itemsTotal)}</span>
            </div>
            {voucherActive ? (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Voucher {order.voucherCode ?? ""}</span>
                <span>-{formatCurrency(order.voucherDiscount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ongkir</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.shippingCost)}</span>
            </div>
            {uniqueCodeActive ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Kode unik</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.uniqueCode)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-base font-semibold text-gray-900">
              <span>Total dibayar</span>
              <span>{formatCurrency(order.totalWithUnique)}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Produk yang Dibeli</h2>
        <div className="mt-4 space-y-4">
          {order.items.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
              Belum ada produk yang tercatat dalam pesanan ini.
            </p>
          ) : null}
          {order.items.map((item) => {
            const product = item.product;
            const seller = product?.seller ?? null;
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-white">
                  {product?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.title ?? "Produk"} className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={PRODUCT_PLACEHOLDER} alt="Produk" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {product ? (
                      <Link href={`/product/${product.id}`} className="hover:underline">
                        {product.title ?? "Produk"}
                      </Link>
                    ) : (
                      <span>Produk sudah tidak tersedia</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">Qty: {item.qty} • Status item: {item.status}</p>
                  {seller ? (
                    <p className="text-xs text-gray-500">
                      Toko:
                      <Link href={`/s/${seller.slug}`} className="ml-1 font-medium text-orange-600 hover:underline">
                        {seller.name}
                      </Link>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Toko tidak tersedia</p>
                  )}
                </div>
                <div className="text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(item.price * item.qty)}
                  <p className="text-xs font-normal text-gray-500">Harga satuan: {formatCurrency(item.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Upload Bukti Transfer</h2>
        <p className="mt-2 text-sm text-gray-600">
          Jika Anda memilih metode pembayaran transfer manual, unggah bukti transfer untuk mempercepat proses verifikasi.
        </p>
        <form
          action={`/api/order/${order.orderCode}/upload-proof`}
          method="post"
          encType="multipart/form-data"
          className="mt-4 space-y-3"
        >
          <input
            type="file"
            name="file"
            accept="image/*"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Upload Bukti Transfer
          </button>
        </form>
      </section>
    </div>
  );
}
