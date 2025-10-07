"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { formatIDR } from "@/lib/utils";

interface FlashSaleRailItem {
  id: string;
  title: string;
  sellerName: string;
  sellerSlug: string;
  salePrice: number;
  originalPrice: number | null;
  discountPercent: number;
  imageUrl: string;
  endsAt: string;
  stock: number;
}

interface FlashSaleRailProps {
  items: FlashSaleRailItem[];
}

interface Countdown {
  hours: string;
  minutes: string;
  seconds: string;
}

function formatCountdown(targetMs: number, nowMs: number): Countdown {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { hours, minutes, seconds };
}

function CountdownDisplay({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    return formatCountdown(new Date(target).getTime(), now);
  }, [now, target]);

  return (
    <div className="flex items-center gap-1 rounded-md bg-black px-2 py-1 text-xs font-semibold text-white">
      <span>{countdown.hours}</span>
      <span>:</span>
      <span>{countdown.minutes}</span>
      <span>:</span>
      <span>{countdown.seconds}</span>
    </div>
  );
}

export function FlashSaleRail({ items }: FlashSaleRailProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [items.length]);

  const nextExpiry = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    const soonest = items.reduce((earliest, current) => {
      return new Date(current.endsAt).getTime() < new Date(earliest.endsAt).getTime()
        ? current
        : earliest;
    }, items[0]!);

    return soonest.endsAt;
  }, [items]);

  const nowMs = now;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold uppercase text-orange-500">Flash Sale</h2>
          {nextExpiry ? <CountdownDisplay target={nextExpiry} /> : null}
        </div>
        <Link
          href="/product"
          className="text-sm font-semibold text-orange-500 hover:text-orange-600"
        >
          Lihat Semua
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-sm text-orange-700">
          Belum ada produk yang sedang mengikuti flash sale. Pantau terus untuk promo terbaru!
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((item) => {
            const countdown = formatCountdown(new Date(item.endsAt).getTime(), nowMs);
            return (
              <div
                key={item.id}
                className="group w-48 shrink-0 overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/product/${item.id}`} className="relative block">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-32 w-full object-cover"
                  />
                  <div className="absolute left-0 top-0 rounded-br-lg bg-orange-500 px-2 py-1 text-xs font-bold uppercase text-white">
                    -{item.discountPercent}%
                  </div>
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                    <span>{countdown.hours}</span>
                    <span>:</span>
                    <span>{countdown.minutes}</span>
                    <span>:</span>
                    <span>{countdown.seconds}</span>
                  </div>
                </Link>
                <div className="space-y-2 p-3">
                  <Link
                    href={`/product/${item.id}`}
                    className="line-clamp-2 text-sm font-semibold text-gray-800 hover:text-orange-600"
                  >
                    {item.title}
                  </Link>
                  <div className="text-xs text-gray-500">
                    oleh{" "}
                    <Link
                      href={`/s/${item.sellerSlug}`}
                      className="font-medium text-orange-500 hover:underline"
                    >
                      {item.sellerName}
                    </Link>
                  </div>
                  <div>
                    {item.originalPrice ? (
                      <div className="text-xs text-gray-400 line-through">
                        Rp {formatIDR(item.originalPrice)}
                      </div>
                    ) : null}
                    <div className="text-lg font-bold text-orange-500">
                      Rp {formatIDR(item.salePrice)}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold uppercase text-orange-600">
                    {item.stock > 0 ? `Sisa ${item.stock} pcs` : "Stok Habis"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
