"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { formatIDR } from "@/lib/utils";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

type VoucherSummary = {
  id: string;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: number;
  minSpend: number;
  expiresAt: string | null;
};

export function ActiveVoucherPopup({ voucher }: { voucher: VoucherSummary }) {
  const storageKey = `toko:voucher-popup:${voucher.id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(storageKey);
    if (!dismissed) {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    }
  };

  const benefitLabel = useMemo(() => {
    if (voucher.kind === "PERCENT") {
      return `Diskon ${voucher.value}%`;
    }
    return `Potongan Rp ${formatIDR(voucher.value)}`;
  }, [voucher.kind, voucher.value]);

  const minSpendLabel = useMemo(() => {
    if (voucher.minSpend <= 0) {
      return "Tanpa minimum belanja";
    }
    return `Min. belanja Rp ${formatIDR(voucher.minSpend)}`;
  }, [voucher.minSpend]);

  const expiresLabel = useMemo(() => {
    if (!voucher.expiresAt) {
      return "Berlaku selama persediaan";
    }
    const formatter = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: JAKARTA_TIME_ZONE,
    });
    return `Berlaku hingga ${formatter.format(new Date(voucher.expiresAt))}`;
  }, [voucher.expiresAt]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(22rem,calc(100%-2rem))]">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-indigo-500/30" aria-hidden="true" />
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 transition hover:bg-white hover:text-gray-700"
          aria-label="Tutup promo voucher"
        >
          ×
        </button>
        <div className="relative space-y-3 p-5 text-sm text-gray-700">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            <span className="rounded-full bg-indigo-600/10 px-2 py-1 text-[11px] text-indigo-700">Voucher Khusus</span>
            <span>Kode: {voucher.code}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{benefitLabel}</p>
            <p className="text-sm text-gray-600">{minSpendLabel}</p>
          </div>
          <p className="text-xs text-gray-500">{expiresLabel}</p>
          <div className="flex items-center gap-2">
            <Link
              href="/checkout"
              className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
            >
              Pakai Sekarang
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-indigo-100 px-3 py-2 text-xs font-medium text-indigo-600 transition hover:border-indigo-200 hover:text-indigo-500"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
