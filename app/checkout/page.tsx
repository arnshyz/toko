"use client";
import { COURIERS } from "@/lib/shipping";
import { useEffect, useState } from "react";

type CartItem = { productId: string; title: string; price: number; qty: number; sellerId: string };

type CheckoutAccountData = {
  profile: {
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  defaultAddress: {
    fullName: string;
    phoneNumber: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
    additionalInfo: string | null;
  } | null;
  addressesCount: number;
};

type CheckoutResponse = {
  orderCode?: string;
  error?: string;
};

function formatAddress(address: NonNullable<CheckoutAccountData["defaultAddress"]>) {
  return [
    address.addressLine,
    address.district,
    address.city,
    address.province,
    address.postalCode ? `Kode Pos ${address.postalCode}` : "",
    address.additionalInfo ?? "",
  ]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [courier, setCourier] = useState<keyof typeof COURIERS>('JNE_REG');
  const [accountData, setAccountData] = useState<CheckoutAccountData | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('cart');
    const arr: CartItem[] = raw ? JSON.parse(raw) : [];
    setItems(arr);
    setTotal(arr.reduce((s, it) => s + it.price * it.qty, 0));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const res = await fetch('/api/account/checkout-data', { credentials: 'include' });
        if (res.status === 401) {
          return;
        }

        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const message = typeof payload?.error === 'string' ? payload.error : 'Gagal memuat data akun.';
          throw new Error(message);
        }

        if (!cancelled && payload) {
          setAccountData(payload as CheckoutAccountData);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Gagal memuat data akun.';
          setAccountError(message);
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) {
      alert('Keranjang Anda kosong.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.append('items', JSON.stringify(items));
    fd.append('courier', courier);

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', body: fd });
      const payload = (await res.json().catch(() => null)) as CheckoutResponse | null;
      if (!res.ok || !payload || typeof payload.orderCode !== 'string') {
        const message = payload?.error ?? 'Gagal membuat pesanan';
        alert(message);
        return;
      }

      localStorage.removeItem('cart');
      window.location.href = `/order/${payload.orderCode}`;
    } finally {
      setSubmitting(false);
    }
  }

  const hasPrefilledAddress = Boolean(accountData?.defaultAddress);
  const loggedInWithoutAddress = Boolean(accountData && accountData.addressesCount === 0 && !accountData.defaultAddress);
  const defaultAddress = accountData?.defaultAddress ?? null;
  const defaultName = hasPrefilledAddress
    ? (defaultAddress?.fullName?.trim() || accountData?.profile.name || '')
    : '';
  const defaultPhone = hasPrefilledAddress
    ? (defaultAddress?.phoneNumber?.trim() || accountData?.profile.phoneNumber || '')
    : '';
  const defaultEmail = hasPrefilledAddress ? accountData?.profile.email ?? '' : '';
  const defaultAddressText = hasPrefilledAddress && defaultAddress ? formatAddress(defaultAddress) : '';
  const missingPrefilledFields = hasPrefilledAddress && (!defaultName || !defaultPhone || !defaultEmail || !defaultAddressText);

  const disableSubmit =
    submitting ||
    items.length === 0 ||
    loggedInWithoutAddress ||
    (missingPrefilledFields ?? false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Data Pembeli</h2>
        <form onSubmit={submit} className="space-y-3">
          {accountLoading ? (
            <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Memuat data akun...
            </div>
          ) : null}

          {accountError ? (
            <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              {accountError}
            </div>
          ) : null}

          {loggedInWithoutAddress ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Anda belum menyimpan alamat pengiriman. Silakan tambahkan alamat di{' '}
              <a href="/account" className="font-semibold text-amber-900 underline">
                Akun Saya
              </a>{' '}
              sebelum melanjutkan checkout.
            </div>
          ) : null}

          {hasPrefilledAddress ? (
            <div className="space-y-3">
              <input type="hidden" name="buyerName" value={defaultName} />
              <input type="hidden" name="buyerPhone" value={defaultPhone} />
              <input type="hidden" name="buyerEmail" value={defaultEmail} />
              <input type="hidden" name="buyerAddress" value={defaultAddressText} />

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-semibold text-emerald-900">Alamat tersimpan digunakan otomatis</p>
                <p className="mt-1 text-emerald-900">{defaultName}</p>
                <p className="text-emerald-900">{defaultPhone}</p>
                <p className="text-emerald-900">{defaultEmail}</p>
                <p className="mt-2 whitespace-pre-line text-emerald-900">{defaultAddressText}</p>
                <p className="mt-3 text-emerald-900">
                  Perbarui data profil atau alamat melalui{' '}
                  <a href="/account" className="font-semibold underline">
                    Akun Saya
                  </a>
                  .
                </p>
                {missingPrefilledFields ? (
                  <p className="mt-3 font-semibold text-emerald-900">
                    Lengkapi nama, email, nomor telepon, dan alamat di Akun Saya agar dapat melanjutkan checkout.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {!accountLoading && !hasPrefilledAddress && !loggedInWithoutAddress ? (
            <>
              <input
                name="buyerName"
                required
                placeholder="Nama Lengkap"
                defaultValue={accountData?.profile.name ?? ''}
                className="border rounded w-full px-3 py-2"
              />
              <input
                name="buyerPhone"
                required
                placeholder="No. WhatsApp (08xxxx)"
                defaultValue={accountData?.profile.phoneNumber ?? ''}
                className="border rounded w-full px-3 py-2"
              />
              <input
                name="buyerEmail"
                type="email"
                required
                placeholder="Email"
                defaultValue={accountData?.profile.email ?? ''}
                className="border rounded w-full px-3 py-2"
              />
              <textarea
                name="buyerAddress"
                required
                placeholder="Alamat Lengkap"
                className="border rounded w-full px-3 py-2"
              />
            </>
          ) : null}

          <div>
            <label className="block text-sm mb-1">Kurir</label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value as keyof typeof COURIERS)}
              className="border rounded w-full px-3 py-2"
            >
              {Object.entries(COURIERS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} (estimasi Rp {new Intl.NumberFormat('id-ID').format(v.fallbackCost)})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Ongkir final dihitung otomatis via RajaOngkir saat pesanan dibuat (per gudang). Estimasi di atas
              digunakan jika RajaOngkir tidak tersedia.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Metode Pembayaran</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="paymentMethod" value="TRANSFER" defaultChecked /> Transfer Manual
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="paymentMethod" value="COD" /> COD (Bayar di Tempat)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Voucher</label>
            <input name="voucher" placeholder="KODEVOUCHER" className="border rounded w-full px-3 py-2"/>
            <p className="text-xs text-gray-500 mt-1">* Potongan diterapkan ke total barang (belum termasuk ongkir & kode unik).</p>
          </div>

          <button className="btn-primary disabled:opacity-60" disabled={disableSubmit}>
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </form>
      </div>
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Ringkasan</h2>
        <ul className="text-sm">
          {items.map(it => (
            <li key={it.productId} className="flex justify-between border-b py-1">
              <span>{it.title} × {it.qty}</span>
              <span>Rp {new Intl.NumberFormat('id-ID').format(it.price*it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="text-right mt-3 font-semibold">Total barang: Rp {new Intl.NumberFormat('id-ID').format(total)}</div>
        <p className="text-xs text-gray-500 mt-1">Total final termasuk ongkir & (jika transfer) kode unik akan muncul di halaman pesanan.</p>
      </div>
    </div>
  );
}
