import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatIDR } from "@/lib/utils";
import { JAKARTA_TIME_ZONE } from "@/lib/time";
import { ClaimVoucherButton } from "@/components/ClaimVoucherButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(value);
}

export default async function VoucherPage() {
  const session = await getSession();
  const viewer = session.user;

  if (!viewer) {
    redirect("/seller/login?redirect=/voucher");
  }

  const now = new Date();
  const [claimed, activePublic] = await Promise.all([
    prisma.userVoucher.findMany({
      where: { userId: viewer.id },
      include: { voucher: true },
      orderBy: { claimedAt: "desc" },
    }),
    prisma.voucher.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
    }),
  ]);

  const claimedIds = new Set(claimed.map((entry) => entry.voucherId));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Voucher Saya</h1>
        <p className="text-sm text-gray-600">
          Simpan dan gunakan voucher promo yang sudah Anda klaim untuk mendapatkan harga terbaik.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Voucher Tersimpan</h2>
        {claimed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Anda belum memiliki voucher tersimpan. Klaim voucher promo di beranda untuk mengisi koleksi Anda.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {claimed.map((entry) => {
              const voucher = entry.voucher;
              const isExpired = voucher.expiresAt ? voucher.expiresAt <= now : false;
              const benefit = voucher.kind === "PERCENT"
                ? `Diskon ${voucher.value}%`
                : `Potongan Rp ${formatIDR(voucher.value)}`;

              return (
                <article
                  key={entry.id}
                  className="flex flex-col justify-between rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-sky-600">
                      <span>Kode {voucher.code}</span>
                      <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-600">Tersimpan</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{benefit}</p>
                    <p className="text-sm text-gray-600">Min. belanja Rp {formatIDR(voucher.minSpend)}</p>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    <p>Disimpan pada {formatDate(entry.claimedAt)}</p>
                    {voucher.expiresAt ? (
                      <p className={isExpired ? "text-red-500" : undefined}>
                        Berlaku hingga {formatDate(voucher.expiresAt)}
                      </p>
                    ) : (
                      <p>Berlaku tanpa batas waktu</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Voucher Lainnya</h2>
        {activePublic.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Belum ada voucher promo yang aktif saat ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activePublic.map((voucher) => {
              const benefit = voucher.kind === "PERCENT"
                ? `Diskon ${voucher.value}%`
                : `Potongan Rp ${formatIDR(voucher.value)}`;
              const isClaimed = claimedIds.has(voucher.id);

              return (
                <article
                  key={voucher.id}
                  className="flex flex-col justify-between rounded-3xl border border-sky-100 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-sky-600">
                      <span>Kode {voucher.code}</span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] text-sky-600">
                        {voucher.expiresAt ? `Sampai ${formatDate(voucher.expiresAt)}` : "Stok terbatas"}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{benefit}</p>
                    <p className="text-sm text-gray-600">Min. belanja Rp {formatIDR(voucher.minSpend)}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Klaim sekarang untuk menyimpannya ke akun Anda.</p>
                    <div className="mt-3">
                      <ClaimVoucherButton
                        voucherId={voucher.id}
                        voucherCode={voucher.code}
                        size="sm"
                        color={isClaimed ? "neutral" : "sky"}
                        variant={isClaimed ? "outline" : "solid"}
                        className={isClaimed ? "w-full" : "w-full shadow"}
                      >
                        {isClaimed ? "Sudah Tersimpan" : "Klaim Sekarang"}
                      </ClaimVoucherButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
