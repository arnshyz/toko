"use client";

import { FormEvent, useState, useTransition } from "react";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(String(body.message ?? "Kami telah mengirim tautan reset password apabila email terdaftar."));
        form.reset();
      } else {
        setError(String(body.message ?? body.error ?? "Terjadi kesalahan. Coba lagi."));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-sky-800">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="masukkan email terdaftar"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Mengirim tautan..." : "Kirim Link Reset Password"}
      </button>
      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 shadow-inner">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</p>
      )}
      <p className="text-sm text-sky-700/80">
        Kami akan mengirim tautan reset password ke email Anda jika terdaftar. Gunakan tautan tersebut untuk membuat password baru.
      </p>
    </form>
  );
}
