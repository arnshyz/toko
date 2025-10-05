// app/order/[code]/page.tsx
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { code: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderCode: params.code },
    include: { items: { include: { product: true } } },
  });
  if (!order) return <div>Pesanan tidak ditemukan.</div>;

  return (
    <div className="space-y-6">
      {/* ===== Detail pesanan kamu (tetap/isi sesuai kebutuhan) ===== */}
      <div className="bg-white border rounded p-4">
        <h1 className="font-semibold text-lg">Order #{order.orderCode}</h1>
        {/* ...detail lain... */}
      </div>

      {/* ===== Upload Bukti Transfer (PASTIKAN BLOK INI DI DALAM RETURN) ===== */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Upload Bukti Transfer</h2>
        <form
          action={`/api/order/${order.orderCode}/upload-proof`}
          method="post"
          encType="multipart/form-data"
        >
          <input type="file" name="file" accept="image/*" className="block mb-3" />
          <button className="border rounded px-4 py-2 bg-green-800 text-white">Upload</button>
        </form>
      </div>

      {/* (opsional) Chat */}
      {/* <OrderChat orderCode={params.code} role="buyer" /> */}
    </div>
  );
}
