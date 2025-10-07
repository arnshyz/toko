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
      <div>
        <label className="block text-sm font-medium text-gray-700">Password Baru</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="minimal 8 karakter"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="ulangi password baru"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        disabled={isPending || !token || !isTokenValid}
      >
        {isPending ? 'Memproses...' : 'Reset Password'}
      </button>
      {message && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="text-sm text-gray-600">
        Pastikan Anda menggunakan password yang kuat dan tidak membagikan tautan reset kepada siapapun.
      </p>
    </form>
  );
}
