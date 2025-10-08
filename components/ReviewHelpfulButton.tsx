"use client";

import { useState, useTransition } from "react";

type ReviewHelpfulButtonProps = {
  reviewId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  isOwnReview: boolean;
};

export function ReviewHelpfulButton({
  reviewId,
  initialCount,
  initialLiked,
  isAuthenticated,
  isOwnReview,
}: ReviewHelpfulButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canInteract = !isOwnReview;

  async function handleClick() {
    if (!canInteract) {
      return;
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          const error = data.error ?? "Gagal memperbarui suka ulasan.";
          setMessage(error);
          return;
        }

        const data = (await response.json()) as { liked: boolean; helpfulCount: number };
        setLiked(data.liked);
        setCount(data.helpfulCount);
      } catch (error) {
        console.error("Failed to toggle review helpful state", error);
        setMessage("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!canInteract || isPending}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
          liked ? "border-sky-500 bg-sky-50 text-sky-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
        } ${!canInteract ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span>{liked ? "Terbantu" : "Beri Suka"}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">{count}</span>
      </button>
      {message ? <p className="text-xs text-rose-600">{message}</p> : null}
      {isOwnReview ? (
        <p className="text-xs text-gray-400">Anda tidak dapat menyukai ulasan milik sendiri.</p>
      ) : null}
    </div>
  );
}
