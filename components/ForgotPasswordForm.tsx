'use client';

import { FormEvent, useState, useTransition } from 'react';

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(String(body.message ?? 'Kami telah mengirim tautan reset password apabila email terdaftar.'));
        form.reset();
      } else {
        setError(String(body.message ?? body.error ?? 'Terjadi kesalahan. Coba lagi.'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="masukkan email terdaftar"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-400/40 transition hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? 'Mengirim tautan...' : 'Kirim Link Reset Password'}
      </button>
      {message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 shadow-inner">{message}</p>}
      {error && <p className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-inner">{error}</p>}
      <p className="text-sm text-slate-600">
        Kami akan mengirim tautan reset password ke email Anda jika terdaftar. Gunakan tautan tersebut untuk membuat password baru.
      </p>
    </form>
  );
}
