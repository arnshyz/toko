import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function SellerLogin() {
  const session = await getSession();

  if (session.user) {
    redirect("/seller/dashboard");
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded p-6">
      <h1 className="text-xl font-semibold mb-4">Login Seller</h1>
      <form method="POST" action="/api/auth/login" className="space-y-3">
        <input type="email" name="email" required placeholder="Email" className="border rounded w-full px-3 py-2"/>
        <input type="password" name="password" required placeholder="Password" className="border rounded w-full px-3 py-2"/>
        <button className="w-full btn-primary">Login</button>
      </form>
      <div className="text-sm text-center mt-3">Belum punya akun? <a className="link" href="/seller/register">Register</a></div>
    </div>
  );
}
