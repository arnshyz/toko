"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";

type BuyerOrderReview = {
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

type BuyerOrder = {
  id: string;
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
  review: BuyerOrderReview | null;
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

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

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

type ReviewDraft = { rating: number; comment: string };
type ReviewMessage = { type: "success" | "error"; text: string };

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>("ALL");
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [reviewMessages, setReviewMessages] = useState<Record<string, ReviewMessage>>({});
  const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 401) {
            setError(data?.error ?? "Silakan masuk terlebih dahulu untuk melihat pesanan Anda.");
            setOrders([]);
          } else {
            setError(data?.error ?? "Gagal memuat pesanan. Coba lagi nanti.");
          }
          return;
        }
        const data = (await res.json()) as BuyerOrder[];
        if (!cancelled) {
          setOrders(data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
        if (!cancelled) {
          setError("Gagal memuat pesanan. Coba lagi nanti.");
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setReviewDrafts((prev) => {
      const next = { ...prev };
      for (const order of orders) {
        if (!next[order.orderCode]) {
          next[order.orderCode] = {
            rating: order.review?.rating ?? 0,
            comment: order.review?.comment ?? "",
          };
        }
      }
      return next;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "ALL") return orders;
    const stageKey = activeTab;
    return orders.filter((order) => determineOrderStage(order) === stageKey);
  }, [activeTab, orders]);

  const handleRatingChange = (orderCode: string, rating: number) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderCode]: {
        rating,
        comment: prev[orderCode]?.comment ?? "",
      },
    }));
  };

  const handleCommentChange = (orderCode: string, comment: string) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderCode]: {
        rating: prev[orderCode]?.rating ?? 0,
        comment,
      },
    }));
  };

  const handleReviewSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    orderCode: string,
  ) => {
    event.preventDefault();
    const draft = reviewDrafts[orderCode] ?? { rating: 0, comment: "" };

    if (draft.rating < 1) {
      setReviewMessages((prev) => ({
        ...prev,
        [orderCode]: {
          type: "error",
          text: "Pilih jumlah bintang terlebih dahulu.",
        },
      }));
      return;
    }

    setSubmittingReview((prev) => ({ ...prev, [orderCode]: true }));
    setReviewMessages((prev) => {
      const { [orderCode]: _removed, ...rest } = prev;
      return rest;
    });

    try {
      const res = await fetch(`/api/orders/${orderCode}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: draft.rating, comment: draft.comment }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setReviewMessages((prev) => ({
          ...prev,
          [orderCode]: {
            type: "error",
            text: data?.error ?? "Gagal menyimpan ulasan. Coba lagi nanti.",
          },
        }));
        return;
      }

      const savedReview = (await res.json()) as BuyerOrderReview;
      setOrders((prev) =>
        prev.map((order) =>
          order.orderCode === orderCode ? { ...order, review: savedReview } : order,
        ),
      );
      setReviewDrafts((prev) => ({
        ...prev,
        [orderCode]: {
          rating: savedReview.rating,
          comment: savedReview.comment ?? "",
        },
      }));
      setReviewMessages((prev) => ({
        ...prev,
        [orderCode]: {
          type: "success",
          text: "Terima kasih! Penilaian Anda tersimpan.",
        },
      }));
    } catch (err) {
      console.error("Failed to submit review", err);
      setReviewMessages((prev) => ({
        ...prev,
        [orderCode]: {
          type: "error",
          text: "Terjadi kesalahan saat menyimpan ulasan. Coba lagi nanti.",
        },
      }));
    } finally {
      setSubmittingReview((prev) => ({ ...prev, [orderCode]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Pesanan Saya</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Semua pesanan yang Anda buat dengan akun ini akan muncul otomatis tanpa perlu menyimpan kode
          secara manual. Setelah pesanan selesai diterima, berikan penilaian dan ulasan untuk membantu
          pembeli lain.
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

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
          <div className="mt-3 text-xs">
            <Link href="/seller/login" className="font-semibold text-rose-800 hover:underline">
              Masuk ke akun Anda
            </Link>
            <span className="mx-1">atau</span>
            <Link href="/seller/register" className="font-semibold text-rose-800 hover:underline">
              daftar sekarang
            </Link>
            untuk mulai berbelanja dan memantau pesanan.
          </div>
        </div>
      ) : null}

      {loading && orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Memuat pesanan terbaru Anda...
        </div>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          <h2 className="text-lg font-semibold text-gray-900">Belum ada pesanan tercatat</h2>
          <p className="mt-2">
            Setelah checkout menggunakan akun ini, pesanan akan otomatis tersimpan dan tampil di halaman ini.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Belanja produk
            </Link>
            <Link
              href="/cart"
              className="rounded-md border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
            >
              Lihat keranjang
            </Link>
          </div>
        </div>
      ) : null}

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Ringkasan Pesanan</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {filteredOrders.length} pesanan
            </span>
          </div>

          {filteredOrders.map((order) => {
            const statusInfo = STATUS_STYLES[order.status];
            const stage = determineOrderStage(order);
            const stageInfo = stage === "OTHER" ? null : STAGE_STYLES[stage];
            const firstSeller = order.items.find((item) => item.product?.seller)?.product?.seller ?? null;
            const firstProductImage = order.items.find((item) => item.product?.imageUrl)?.product?.imageUrl ?? null;
            const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);
            const draft = reviewDrafts[order.orderCode] ?? { rating: order.review?.rating ?? 0, comment: order.review?.comment ?? "" };
            const reviewMessage = reviewMessages[order.orderCode];
            const submitting = submittingReview[order.orderCode] ?? false;
            const canReview = stage === "COMPLETED" && order.status === "PAID";
            const review = order.review;

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
                  <p className="text-xs text-gray-500">
                    Pesanan ini akan tetap tersimpan di akun Anda. Jika membutuhkan bantuan lebih lanjut, hubungi layanan pelanggan kami.
                  </p>
                  <Link
                    href={`/order/${order.orderCode}`}
                    className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Lihat Detail
                  </Link>
                </div>

                <div className="space-y-3 rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-orange-700">Penilaian Pesanan</h4>
                    {review ? (
                      <span className="text-xs text-orange-600">
                        Terakhir diperbarui {formatDateTime(review.updatedAt)}
                      </span>
                    ) : null}
                  </div>
                  <form
                    onSubmit={(event) => handleReviewSubmit(event, order.orderCode)}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-1">
                      {RATING_VALUES.map((value) => {
                        const isActive = draft.rating >= value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleRatingChange(order.orderCode, value)}
                            className={`text-xl transition ${isActive ? "text-amber-500" : "text-gray-300 hover:text-amber-400"}`}
                            aria-label={`${value} bintang`}
                          >
                            {isActive ? "★" : "☆"}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      value={draft.comment}
                      onChange={(event) => handleCommentChange(order.orderCode, event.target.value)}
                      placeholder="Bagikan pengalaman Anda dengan pesanan ini"
                      rows={3}
                      className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={submitting || !canReview}
                      >
                        {submitting ? "Menyimpan..." : review ? "Perbarui Penilaian" : "Kirim Penilaian"}
                      </button>
                      {!canReview ? (
                        <span className="text-xs text-orange-600">
                          Penilaian bisa diberikan setelah pesanan selesai diterima.
                        </span>
                      ) : null}
                      {reviewMessage ? (
                        <span
                          className={`text-xs font-medium ${
                            reviewMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {reviewMessage.text}
                        </span>
                      ) : null}
                    </div>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
