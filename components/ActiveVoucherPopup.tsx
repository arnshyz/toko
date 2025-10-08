"use client";

import { useEffect, useMemo, useState } from "react";
import { formatIDR } from "@/lib/utils";
import { JAKARTA_TIME_ZONE } from "@/lib/time";
import { ClaimVoucherButton } from "@/components/ClaimVoucherButton";

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
    <div className="fixed left-1/2 top-1/2 z-50 w-[min(18rem,calc(100%-3rem))] -translate-x-1/2 -translate-y-1/2 md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-[min(22rem,calc(100%-2rem))] md:translate-x-0 md:translate-y-0">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-sky-500/30" aria-hidden="true" />
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-500 transition hover:bg-white hover:text-gray-700 md:right-3 md:top-3 md:h-8 md:w-8"
          aria-label="Tutup promo voucher"
        >
          ×
        </button>
        <div className="relative space-y-2 p-4 text-xs text-gray-700 md:space-y-3 md:p-5 md:text-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-sky-600 md:text-xs">
            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] text-sky-600 md:text-[11px]">Voucher Khusus</span>
            <span>Kode: {voucher.code}</span>
          </div>
          <div className="space-y-1 md:space-y-2">
            <p className="text-base font-semibold text-gray-900 md:text-lg">{benefitLabel}</p>
            <p className="text-xs text-gray-600 md:text-sm">{minSpendLabel}</p>
          </div>
          <p className="text-[11px] text-gray-500 md:text-xs">{expiresLabel}</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <ClaimVoucherButton
              voucherId={voucher.id}
              voucherCode={voucher.code}
              className="w-full md:flex-1"
            >
              Klaim Sekarang
            </ClaimVoucherButton>
            <button
              type="button"
              onClick={dismiss}
              className="w-full rounded-full border border-sky-200 px-3 py-2 text-[11px] font-medium text-sky-600 transition hover:border-sky-300 hover:text-sky-500 md:w-auto"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
