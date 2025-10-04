import { getSafeRedirect } from "@/lib/auth";

type SearchParams = { redirect?: string };

export default function RegisterPage({ searchParams }: { searchParams?: SearchParams }) {
  const redirectRaw = searchParams?.redirect ?? null;
  const redirect = getSafeRedirect(redirectRaw, "/");
  const loginLink = `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="max-w-md mx-auto bg-white border rounded p-6">
      <h1 className="text-xl font-semibold mb-4">Daftar Akun Pembeli</h1>
      <form method="POST" action="/api/auth/register" className="space-y-3">
        <input type="hidden" name="redirect" value={loginLink} />
        <input type="text" name="name" required placeholder="Nama Lengkap" className="border rounded w-full px-3 py-2"/>
        <input type="email" name="email" required placeholder="Email" className="border rounded w-full px-3 py-2"/>
        <input type="password" name="password" required placeholder="Password" className="border rounded w-full px-3 py-2"/>
        <button className="w-full btn-primary">Buat Akun</button>
      </form>
      <div className="text-sm text-center mt-3">
        Sudah punya akun? <a className="link" href={loginLink}>Login</a>
      </div>
    </div>
  );
}
