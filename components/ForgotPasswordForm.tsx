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
        setMessage(String(body.message ?? 'Kami telah mengirim OTP reset password apabila email terdaftar.'));
        form.reset();
      } else {
        setError(String(body.message ?? body.error ?? 'Terjadi kesalahan. Coba lagi.'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="masukkan email terdaftar"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? 'Mengirim OTP...' : 'Kirim OTP Reset Password'}
      </button>
      {message && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="text-sm text-gray-600">
        Kami akan mengirim kode OTP ke email Anda jika terdaftar. Gunakan kode tersebut untuk membuat password baru.
      </p>
    </form>
  );
}
