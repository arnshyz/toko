"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";

type BuyerOrder = {
  orderCode: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: "TRANSFER" | "COD";
  courier: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  voucherCode: string | null;
  voucherDiscount: number;
  itemsTotal: number;
  shippingCost: number;
  uniqueCode: number;
  totalWithUnique: number;
  createdAt: string;
  items: {
    id: string;
    qty: number;
    price: number;
    status: "PENDING" | "PACKED" | "SHIPPED" | "DELIVERED" | string;
    productId: string;
    product: null | {
      id: string;
      title: string | null;
      imageUrl: string | null;
      seller: {
        id: string;
        name: string;
        slug: string;
      } | null;
    };
  }[];
};

const STATUS_STYLES: Record<BuyerOrder["status"], { label: string; className: string }> = {
  PENDING: { label: "Menunggu Pembayaran", className: "bg-amber-100 text-amber-700" },
  PAID: { label: "Sudah Dibayar", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700" },
};

const ORDER_TABS = [
  { id: "ALL", label: "All" },
  { id: "UNPAID", label: "Belum Bayar" },
  { id: "PACKING", label: "Sedang Dikemas" },
  { id: "SHIPPING", label: "Dikirim" },
  { id: "COMPLETED", label: "Selesai" },
] as const;

type OrderTab = (typeof ORDER_TABS)[number]["id"];

const STAGE_STYLES: Record<Exclude<OrderTab, "ALL">, { label: string; className: string }> = {
  UNPAID: { label: "Belum Bayar", className: "bg-amber-100 text-amber-700" },
  PACKING: { label: "Sedang Dikemas", className: "bg-blue-100 text-blue-700" },
  SHIPPING: { label: "Sedang Dikirim", className: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
};

function determineOrderStage(order: BuyerOrder): Exclude<OrderTab, "ALL"> | "OTHER" {
  if (order.status === "PENDING") return "UNPAID";
  if (order.status === "CANCELLED") return "OTHER";

  const itemStatuses = order.items.map((item) =>
    typeof item.status === "string" ? item.status.toUpperCase() : "",
  );
  if (itemStatuses.length > 0 && itemStatuses.every((status) => status === "DELIVERED")) {
    return "COMPLETED";
  }
  if (itemStatuses.some((status) => status === "SHIPPED")) {
    return "SHIPPING";
  }
  if (itemStatuses.some((status) => status === "PACKED")) {
    return "PACKING";
  }
  if (itemStatuses.some((status) => status === "DELIVERED")) {
    return "SHIPPING";
  }

  return "PACKING";
}

const PAYMENT_LABELS: Record<BuyerOrder["paymentMethod"], string> = {
  TRANSFER: "Transfer Manual",
  COD: "Bayar di Tempat (COD)",
};

function formatCurrency(amount: number) {
  return `Rp ${formatIDR(amount)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function sanitizeHistoryList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((code): code is string => Boolean(code));
}

export default function BuyerOrdersPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [missingCodes, setMissingCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>("ALL");

  const readHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem("orderHistory");
      if (!raw) return [] as string[];
      const parsed = JSON.parse(raw);
      return sanitizeHistoryList(parsed).slice(0, 20);
    } catch (error) {
      console.error("Failed to read order history", error);
      return [] as string[];
    }
  }, []);

  const persistHistory = useCallback(
    (list: string[]) => {
      try {
        const unique = list.reduce<string[]>((acc, code) => {
          if (!acc.includes(code)) acc.push(code);
          return acc;
        }, []);
        const trimmed = unique.slice(0, 20);
        localStorage.setItem("orderHistory", JSON.stringify(trimmed));
        setCodes(trimmed);
      } catch (error) {
        console.error("Failed to persist order history", error);
      }
    },
    [],
  );

  useEffect(() => {
    setCodes(readHistory());
  }, [readHistory]);

  useEffect(() => {
    if (!codes.length) {
      setOrders([]);
      setMissingCodes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      codes.map(async (code) => {
        try {
          const res = await fetch(`/api/orders/${code}`);
          if (!res.ok) return { code, order: null as BuyerOrder | null };
          const data = (await res.json()) as BuyerOrder;
          return { code, order: data };
        } catch (error) {
          console.error("Failed to fetch order", error);
          return { code, order: null as BuyerOrder | null };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const found = results.filter((entry) => entry.order !== null) as { code: string; order: BuyerOrder }[];
      const missing = results.filter((entry) => entry.order === null).map((entry) => entry.code);
      setOrders(found.map((entry) => entry.order));
      setMissingCodes(missing);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [codes]);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = lookupCode.trim().toUpperCase();
    if (!code) return;
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/orders/${code}`);
      if (!res.ok) {
        setLookupError("Pesanan tidak ditemukan. Periksa kembali kode pesanan Anda.");
        return;
      }
      const order = (await res.json()) as BuyerOrder;
      persistHistory([code, ...codes.filter((existing) => existing !== code)]);
      setOrders((prev) => {
        const without = prev.filter((item) => item.orderCode !== order.orderCode);
        return [order, ...without];
      });
      setMissingCodes((prev) => prev.filter((missingCode) => missingCode !== code));
      setLookupCode("");
    } catch (error) {
      console.error("Failed to lookup order", error);
      setLookupError("Terjadi kesalahan saat mengambil pesanan. Coba lagi nanti.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRemove = (code: string) => {
    persistHistory(codes.filter((item) => item !== code));
    setOrders((prev) => prev.filter((item) => item.orderCode !== code));
    setMissingCodes((prev) => prev.filter((item) => item !== code));
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem("orderHistory");
    } catch (error) {
      console.error("Failed to clear order history", error);
    }
    setCodes([]);
    setOrders([]);
    setMissingCodes([]);
  };

  const hasHistory = codes.length > 0;

  const filteredOrders = useMemo(() => {
    if (activeTab === "ALL") return orders;
    const stageKey = activeTab;
    return orders.filter((order) => determineOrderStage(order) === stageKey);
  }, [activeTab, orders]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Pesanan Saya</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Lihat riwayat pesanan Anda, cek status pembayaran, dan temukan detail produk serta toko tempat Anda berbelanja.
          Simpan kode pesanan untuk memantau perkembangannya di sini.
        </p>
      </header>

      <nav className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto pb-2">
        {ORDER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive ? "bg-orange-500 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4">
        <form onSubmit={handleLookup} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label htmlFor="order-code" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-orange-700">
              Tambahkan pesanan dengan kode
            </label>
            <input
              id="order-code"
              name="code"
              value={lookupCode}
              onChange={(event) => setLookupCode(event.target.value)}
              placeholder="Contoh: ORD-1A2B3C4D"
              className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={lookupLoading}
          >
            {lookupLoading ? "Mencari..." : "Simpan Kode"}
          </button>
        </form>
        {lookupError && <p className="mt-2 text-sm text-rose-600">{lookupError}</p>}
      </section>

      {hasHistory ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Pesanan</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{codes.length} kode tersimpan</span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                Hapus riwayat
              </button>
            </div>
          </div>

          {loading && orders.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Memuat pesanan terbaru Anda...
            </div>
          ) : null}

          {filteredOrders.map((order) => {
            const statusInfo = STATUS_STYLES[order.status];
            const stage = determineOrderStage(order);
            const stageInfo = stage === "OTHER" ? null : STAGE_STYLES[stage];
            const firstSeller = order.items.find((item) => item.product?.seller)?.product?.seller ?? null;
            const firstProductImage = order.items.find((item) => item.product?.imageUrl)?.product?.imageUrl ?? null;
            const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

            return (
              <article key={order.orderCode} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-gray-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      {firstSeller ? (
                        <Link href={`/s/${firstSeller.slug}`} className="font-semibold text-gray-900 hover:text-orange-600">
                          {firstSeller.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900">Pesanan #{order.orderCode}</span>
                      )}
                      <span className="hidden text-gray-300 md:inline">•</span>
                      <span className="text-xs uppercase tracking-wide text-gray-400">Kode {order.orderCode}</span>
                    </div>
                    <p className="text-xs text-gray-500">Dibuat pada {formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    {stageInfo ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageInfo.className}`}>
                        {stageInfo.label}
                      </span>
                    ) : null}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                    <p className="text-xs text-gray-500">Metode: {PAYMENT_LABELS[order.paymentMethod]}</p>
                    <p className="text-xs text-gray-500">Pengiriman: {order.courier}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => {
                    const product = item.product;
                    const seller = product?.seller ?? null;
                    const productImage = product?.imageUrl ?? firstProductImage;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="h-20 w-20 overflow-hidden rounded-md border border-gray-200 bg-white">
                          {productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={productImage} alt={product?.title ?? "Produk"} className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="https://placehold.co/96x96?text=Produk" alt="Produk" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {product ? (
                              <Link href={`/product/${product.id}`} className="hover:underline">
                                {product.title ?? "Produk"}
                              </Link>
                            ) : (
                              <span>Produk sudah tidak tersedia</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                          <p className="text-xs text-gray-500">Status item: {item.status}</p>
                          {seller ? (
                            <p className="text-xs text-gray-500">
                              Toko:
                              <Link href={`/s/${seller.slug}`} className="ml-1 font-medium text-orange-600 hover:underline">
                                {seller.name}
                              </Link>
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price * item.qty)}
                          <p className="text-xs font-normal text-gray-500">Harga satuan: {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">Alamat Pengiriman</h4>
                    <p className="text-sm font-medium text-gray-900">{order.buyerName}</p>
                    <p className="text-xs text-gray-600">{order.buyerPhone}</p>
                    <p className="text-sm text-gray-600">{order.buyerAddress}</p>
                  </div>
                  <div className="space-y-2 rounded-lg border border-gray-100 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">Ringkasan Pembayaran</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total barang ({totalItems} item)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.itemsTotal)}</span>
                    </div>
                    {order.voucherDiscount > 0 ? (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>Voucher {order.voucherCode ?? ""}</span>
                        <span>-{formatCurrency(order.voucherDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ongkir</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.shippingCost)}</span>
                    </div>
                    {order.paymentMethod === "TRANSFER" && order.uniqueCode > 0 ? (
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleRemove(order.orderCode)}
                      className="font-medium text-rose-600 hover:text-rose-700"
                    >
                      Hapus dari daftar
                    </button>
                    <span className="hidden text-gray-300 md:inline">•</span>
                    <span>Simpan kode ini untuk memantau perkembangan pesanan Anda.</span>
                  </div>
                  <Link
                    href={`/order/${order.orderCode}`}
                    className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </article>
            );
          })}

          {filteredOrders.length === 0 && !loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Belum ada pesanan pada kategori ini. Coba lihat tab lainnya atau tambahkan kode pesanan baru.
            </div>
          ) : null}

          {orders.length === 0 && !loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Kami tidak menemukan detail untuk kode yang tersimpan. Tambahkan kode pesanan baru untuk mulai melacak belanja Anda.
            </div>
          ) : null}

          {missingCodes.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Beberapa kode tidak ditemukan atau pesanan sudah dihapus: {missingCodes.join(", ")}. Anda dapat menghapusnya dari daftar riwayat.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          <h2 className="text-lg font-semibold text-gray-900">Belum ada pesanan tersimpan</h2>
          <p className="mt-2">
            Setelah checkout, kode pesanan Anda akan otomatis tersimpan di sini. Anda juga bisa menambahkan kode secara manual menggunakan formulir di atas.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Belanja produk
            </Link>
            <Link href="/cart" className="rounded-md border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50">
              Lihat keranjang
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
