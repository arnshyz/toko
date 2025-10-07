"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

function mergeClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type ClaimVoucherButtonProps = {
  voucherId: string;
  voucherCode: string;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md";
  variant?: "solid" | "outline";
  color?: "indigo" | "salmon";
};

export function ClaimVoucherButton({
  voucherId,
  voucherCode,
  children,
  className,
  size = "md",
  variant = "solid",
  color = "indigo",
}: ClaimVoucherButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "claimed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = status === "loading";
  const isClaimed = status === "claimed";

  const sizeClass = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
  const baseClass = (() => {
    if (variant === "outline") {
      if (color === "salmon") {
        return "border border-[#fcd3c7] text-[#f53d2d] hover:border-[#f8b5a3] hover:text-[#d73224]";
      }
      return "border border-indigo-200 text-indigo-600 hover:border-indigo-300 hover:text-indigo-500";
    }

    if (color === "salmon") {
      return "bg-[#f53d2d] text-white hover:bg-[#d73224]";
    }

    return "bg-indigo-600 text-white hover:bg-indigo-500";
  })();

  const disabledClass = isLoading || isClaimed ? "opacity-80 cursor-not-allowed" : "";

  const label = isClaimed ? "Voucher Tersimpan" : children ?? "Klaim";

  async function handleClaim() {
    if (isLoading || isClaimed) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/vouchers/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voucherId, voucherCode }),
      });

      if (response.status === 401) {
        setStatus("idle");
        setErrorMessage("Silakan login terlebih dahulu.");
        window.location.href = "/seller/login?redirect=/voucher";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Gagal klaim voucher." }));
        setStatus("error");
        setErrorMessage(data.error ?? "Voucher tidak dapat diklaim.");
        return;
      }

      setStatus("claimed");
      setErrorMessage(null);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        disabled={isLoading || isClaimed}
        onClick={handleClaim}
        className={mergeClassNames(
          "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
          sizeClass,
          baseClass,
          disabledClass,
          className,
        )}
      >
        {isLoading ? "Menyimpan..." : label}
      </button>
      {errorMessage ? (
        <span className="text-xs font-medium text-red-600" role="status">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
