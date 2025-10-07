import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JAKARTA_TIME_ZONE } from "@/lib/time";

export default async function Warehouses() {
  const session = await getSession();
  const user = session.user;
  if (!user) return <div>Harap login.</div>;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBanned: true, sellerOnboardingStatus: true },
  });

  if (!account || account.isBanned) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Gudang</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Tidak dapat mengelola gudang karena akun diblokir. Hubungi
          {" "}
          <a className="underline" href="mailto:support@akay.id">
            support@akay.id
          </a>
          {" "}
          untuk mengaktifkan kembali akses Anda.
        </div>
      </div>
    );
  }

  if (account.sellerOnboardingStatus !== "ACTIVE") {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Gudang</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Fitur gudang tersedia setelah toko Anda aktif. Ikuti tahapan pada
          <a className="ml-1 font-semibold underline" href="/seller/onboarding">
            halaman onboarding seller
          </a>
          .
        </div>
      </div>
    );
  }

  const warehouses = await prisma.warehouse.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Gudang</h1>
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Tambah Gudang</h2>
        <form method="POST" action="/api/seller/warehouses/create" className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="name" required placeholder="Nama gudang" className="border rounded px-3 py-2"/>
          <input name="city" placeholder="Kota (opsional)" className="border rounded px-3 py-2"/>
          <button className="btn-primary md:col-span-1">Simpan</button>
        </form>
      </div>
      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Nama</th><th>Kota</th><th>Tanggal</th></tr></thead>
          <tbody>
            {warehouses.map(w => (
              <tr key={w.id} className="border-b">
                <td className="py-2">{w.name}</td>
                <td>{w.city || '-'}</td>
                <td>{new Date(w.createdAt).toLocaleString('id-ID', { timeZone: JAKARTA_TIME_ZONE })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
