'use client';

import { FormEvent, useState, useTransition } from 'react';

type ResetPasswordFormProps = {
  token: string | null;
  isTokenValid: boolean;
  invalidReason?: string;
};

export default function ResetPasswordForm({ token, isTokenValid, invalidReason }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(
    isTokenValid ? null : invalidReason ?? 'Token reset password tidak valid atau sudah tidak berlaku.',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !isTokenValid) {
      setMessage(null);
      setError('Token reset password tidak valid atau sudah tidak berlaku.');
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(String(body.message ?? 'Password berhasil diperbarui.'));
        form.reset();
      } else {
        setError(String(body.error ?? body.message ?? 'Token reset password tidak valid atau sudah tidak berlaku.'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token ?? ''} />
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Password Baru</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="minimal 8 karakter"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="ulangi password baru"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-400/40 transition hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        disabled={isPending || !token || !isTokenValid}
      >
        {isPending ? 'Memproses...' : 'Reset Password'}
      </button>
      {message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 shadow-inner">{message}</p>}
      {error && <p className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-inner">{error}</p>}
      <p className="text-sm text-slate-600">
        Pastikan Anda menggunakan password yang kuat dan tidak membagikan tautan reset kepada siapapun.
      </p>
    </form>
  );
}
