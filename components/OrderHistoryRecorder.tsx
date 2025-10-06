"use client";

import { useEffect } from "react";

export function OrderHistoryRecorder({ orderCode }: { orderCode: string }) {
  useEffect(() => {
    if (!orderCode) return;
    try {
      const existingRaw = localStorage.getItem("orderHistory");
      const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
      const nextHistory = [orderCode, ...existing.filter((code) => code !== orderCode)].slice(0, 20);
      localStorage.setItem("orderHistory", JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Failed to record order history", error);
    }
  }, [orderCode]);

  return null;
}
