'use client';

import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
    };
  }
}

type MidtransPayButtonProps = {
  token: string;
  orderCode: string;
  redirectUrl?: string;
};

const SNAP_SCRIPT_ID = "midtrans-snap-script";

export default function MidtransPayButton({ token, orderCode, redirectUrl }: MidtransPayButtonProps) {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientKey) {
      setError("MIDTRANS client key belum dikonfigurasi");
      return;
    }

    setError(null);

    if (typeof window === "undefined") return;

    if (window.snap) {
      setReady(true);
      return;
    }

    const existing = document.getElementById(SNAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => setReady(true);
      const onError = () => setError("Gagal memuat skrip Midtrans");
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
      if ((existing as any).dataset?.loaded === "true") {
        setReady(true);
      }
      return () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
      };
    }

    const script = document.createElement("script");
    script.id = SNAP_SCRIPT_ID;
    script.src = snapScriptUrl;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      setReady(true);
      script.setAttribute("data-loaded", "true");
    };
    script.onerror = () => {
      setError("Gagal memuat skrip Midtrans");
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [clientKey, snapScriptUrl]);

  const handlePay = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.snap && token) {
      window.snap.pay(token, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => window.location.reload(),
        onClose: () => {
          /* user closed the popup */
        },
      });
    } else if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    }
  }, [redirectUrl, token]);

  if (!clientKey) {
    return <p className="text-sm text-red-600">Konfigurasi Midtrans belum lengkap. Hubungi admin.</p>;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={!ready || !!error}
        className="btn-primary disabled:opacity-60"
      >
        {ready && !error ? "Bayar Sekarang" : "Menyiapkan Pembayaran..."}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {!ready && !error ? (
        <p className="text-xs text-gray-500">Memuat widget pembayaran Midtrans…</p>
      ) : null}
      <p className="text-xs text-gray-500">Kode Pesanan: {orderCode}</p>
    </div>
  );
}
