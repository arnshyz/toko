"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

export type AddToCartFormProps = {
  productId: string;
  title: string;
  price: number;
  sellerId: string;
  stock: number;
  imageUrl?: string | null;
  isLoggedIn?: boolean;
  variant?: "default" | "mobile";
  orderNote?: string;
  selectedVariants?: Record<string, string> | undefined;
};

type CartItem = {
  productId: string;
  title: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
  sellerId: string;
  note?: string | null;
  variants?: Record<string, string>;
};

const createVariantKey = (value?: Record<string, string> | null) => {
  if (!value) return null;
  const entries = Object.entries(value).filter(([, option]) => Boolean(option));
  if (entries.length === 0) return null;
  return entries
    .map(([group, option]) => [group, option] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, option]) => `${group}=${option}`)
    .join("|");
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
  variant = "default",
  orderNote,
  selectedVariants,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "success" | "unauthenticated">("idle");
  const router = useRouter();

  const persistCartItem = useCallback(
    (options?: { showSuccessMessage?: boolean }) => {
      if (!isLoggedIn) {
        setStatus("unauthenticated");
        return false;
      }

      const safeQty = Math.max(1, Math.min(quantity, stock || quantity));
      const normalizedNote = typeof orderNote === "string" ? orderNote.trim() : "";
      const noteValue = normalizedNote ? normalizedNote : null;
      const variantsValue =
        selectedVariants && Object.keys(selectedVariants).length > 0
          ? { ...selectedVariants }
          : undefined;
      const variantsKey = createVariantKey(variantsValue);

      const cart = readCart();
      const index = cart.findIndex((item) => {
        const itemVariantsKey = createVariantKey(item.variants ?? null);
        return (
          item.productId === productId &&
          (item.note ?? "") === (noteValue ?? "") &&
          itemVariantsKey === variantsKey
        );
      });

      if (index >= 0) {
        cart[index].qty += safeQty;
        cart[index].note = noteValue;
        if (variantsValue) {
          cart[index].variants = variantsValue;
        } else {
          delete cart[index].variants;
        }
      } else {
        cart.push({
          productId,
          title,
          price,
          qty: safeQty,
          sellerId,
          imageUrl,
          note: noteValue,
          variants: variantsValue,
        });
      }

      writeCart(cart);

      if (options?.showSuccessMessage) {
        setStatus("success");
      } else {
        setStatus("idle");
      }

      return true;
    },
    [imageUrl, isLoggedIn, orderNote, price, productId, quantity, selectedVariants, sellerId, stock, title],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      persistCartItem({ showSuccessMessage: true });
    },
    [persistCartItem],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.max(1, Math.floor(value)));
  }, []);

  const handleBuyNow = useCallback(() => {
    const saved = persistCartItem();
    if (!saved) {
      return;
    }
    router.push("/checkout");
  }, [persistCartItem, router]);

  if (variant === "mobile") {
    return (
      <form className="space-y-4 lg:hidden" onSubmit={handleSubmit}>
        <input type="hidden" name="productId" value={productId} />
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-3 block text-sm font-semibold text-gray-700" htmlFor="quantity-input-mobile">
            Jumlah
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="quantity-input-mobile"
              type="number"
              name="qty"
              value={quantity}
              min={1}
              onChange={handleChange}
              className="h-11 w-24 rounded-lg border border-gray-300 px-3 text-center text-sm focus:border-sky-500 focus:outline-none"
            />
            <span className="text-xs text-gray-500">Stok tersedia: {stock}</span>
          </div>
        </div>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
          <div className="pointer-events-auto space-y-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-xl shadow-black/5">
            {status === "success" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Produk berhasil ditambahkan ke keranjang. <a className="font-semibold underline" href="/cart">Lihat keranjang</a>.
              </div>
            ) : null}
            {status === "unauthenticated" ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                Silahkan login jika ingin memasukan ke keranjang.
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-600 transition hover:border-sky-200 hover:text-sky-500"
                aria-label="Tambahkan ke favorit"
              >
                ❤
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-600 transition hover:bg-sky-200"
              >
                Masukkan Keranjang
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-[1.3] rounded-full bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

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
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-sky-500 focus:outline-none"
          />
          <span className="text-xs text-gray-500">Stok tersedia: {stock}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="flex-1 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600">
          Masukkan Keranjang
        </button>
        <LinkButton href="/checkout" label="Beli Sekarang" variant="outline" onClick={handleBuyNow} />
        <button
          type="button"
          className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-sky-200 hover:text-sky-600"
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
  onClick?: () => void;
};

function LinkButton({ href, label, variant = "solid", onClick }: LinkButtonProps) {
  const commonProps = {
    className:
      variant === "outline"
        ? "flex-1 rounded-full border border-sky-500 px-6 py-3 text-center text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
        : "flex-1 rounded-full bg-sky-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600",
  } as const;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} {...commonProps}>
        {label}
      </button>
    );
  }

  return (
    <a href={href} {...commonProps}>
      {label}
    </a>
  );
}
