export default function SellerRegister() {
  return (
    <div className="max-w-md mx-auto bg-white border rounded p-6">
      <h1 className="text-xl font-semibold mb-4">Register Seller</h1>
      <form method="POST" action="/api/auth/register" className="space-y-3">
        <input type="text" name="name" required placeholder="Nama Toko" className="border rounded w-full px-3 py-2"/>
        <input type="email" name="email" required placeholder="Email" className="border rounded w-full px-3 py-2"/>
        <input type="password" name="password" required placeholder="Password" className="border rounded w-full px-3 py-2"/>
        <button className="w-full btn-primary">Buat Akun</button>
      </form>
      <div className="text-sm text-center mt-3"><a className="link" href="/seller/login">Sudah punya akun? Login</a></div>
    </div>
  );
}
