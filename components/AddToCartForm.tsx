"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

export type AddToCartFormProps = {
  productId: string;
  title: string;
  price: number;
  sellerId: string;
  stock: number;
  imageUrl?: string | null;
  isLoggedIn?: boolean;
};

type CartItem = {
  productId: string;
  title: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
  sellerId: string;
};

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to read cart", error);
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem("cart", JSON.stringify(items));
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { totalQty, items } }));
}

export function AddToCartForm({
  productId,
  title,
  price,
  sellerId,
  stock,
  imageUrl,
  isLoggedIn = false,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "success" | "unauthenticated">("idle");

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isLoggedIn) {
        setStatus("unauthenticated");
        return;
      }

      const safeQty = Math.max(1, Math.min(quantity, stock || quantity));

      const cart = readCart();
      const index = cart.findIndex((item) => item.productId === productId);
      if (index >= 0) {
        cart[index].qty += safeQty;
      } else {
        cart.push({ productId, title, price, qty: safeQty, sellerId, imageUrl });
      }
      writeCart(cart);
      setStatus("success");
    },
    [imageUrl, isLoggedIn, price, productId, quantity, sellerId, stock, title],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.max(1, Math.floor(value)));
  }, []);

  return (
    <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-4" onSubmit={handleSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="quantity-input">
          Jumlah
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="quantity-input"
            type="number"
            name="qty"
            value={quantity}
            min={1}
            onChange={handleChange}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-orange-500 focus:outline-none"
          />
          <span className="text-xs text-gray-500">Stok tersedia: {stock}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="flex-1 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
          Masukkan Keranjang
        </button>
        <LinkButton href="/checkout" label="Beli Sekarang" variant="outline" />
        <button
          type="button"
          className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:text-orange-600"
        >
          ❤ Favorit
        </button>
      </div>
      {status === "success" ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Produk berhasil ditambahkan ke keranjang. Lanjutkan belanja atau <a className="font-semibold underline" href="/cart">lihat keranjang</a>.
        </div>
      ) : null}
      {status === "unauthenticated" ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Silahkan login jika ingin memasukan ke keranjang.
        </div>
      ) : null}
    </form>
  );
}

type LinkButtonProps = {
  href: string;
  label: string;
  variant?: "solid" | "outline";
};

function LinkButton({ href, label, variant = "solid" }: LinkButtonProps) {
  if (variant === "outline") {
    return (
      <a
        href={href}
        className="flex-1 rounded-full border border-orange-500 px-6 py-3 text-center text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="flex-1 rounded-full bg-orange-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
    >
      {label}
    </a>
  );
}
