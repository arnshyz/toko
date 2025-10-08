import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const steps = [
  {
    title: "Lengkapi Profil",
    description: "Isi data toko, alamat, dan informasi penjual di halaman pengaturan seller.",
  },
  {
    title: "Unggah Produk",
    description: "Tambahkan minimal satu produk dengan foto dan deskripsi lengkap.",
  },
  {
    title: "Ajukan Verifikasi",
    description: "Kirim permohonan aktivasi ke tim kami dan tunggu persetujuan dalam 1x24 jam kerja.",
  },
];

export default async function SellerOnboarding() {
  const session = await getSession();
  const sessionUser = session.user;

  if (!sessionUser) {
    redirect("/seller/login?status=NOT_STARTED");
  }

  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      sellerOnboardingStatus: true,
      isBanned: true,
    },
  });

  if (!account || account.isBanned) {
    redirect("/seller/login?error=banned");
  }

  if (account.sellerOnboardingStatus === "ACTIVE") {
    redirect("/seller/dashboard");
  }

  const statusLabel =
    account.sellerOnboardingStatus === "IN_PROGRESS"
      ? "Proses verifikasi"
      : "Belum memulai";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-sky-500 to-sky-400 p-[1px] shadow-xl">
        <div className="rounded-[34px] bg-white p-8 shadow-inner">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Onboarding Seller</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Mulai buka toko di Akay Nusantara</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Hai {account.name.split(" ")[0]}, akun Anda saat ini berada pada status <strong>{statusLabel}</strong>.
            Ikuti langkah berikut untuk mengaktifkan dashboard seller dan mulai berjualan.
          </p>
          <div className="mt-6 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-base font-semibold text-sky-600">
                {account.sellerOnboardingStatus === "IN_PROGRESS" ? "⏳" : "🛍️"}
              </span>
              <span>
                Status akun seller: <strong>{account.sellerOnboardingStatus}</strong>
              </span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            >
              Belanja sebagai pembeli
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Langkah aktivasi toko</h2>
        <p className="mt-2 text-sm text-gray-600">
          Setelah menyelesaikan setiap tahap, tim kami akan meninjau data Anda. Kami akan mengirimkan email pemberitahuan
          ketika toko siap digunakan.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-semibold text-sky-600 shadow">
                {index + 1}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-dashed border-sky-300/40 bg-sky-50 p-8 text-sm text-sky-700">
        <p>
          Setelah seluruh tahap selesai, hubungi tim kami melalui email <a className="underline" href="mailto:support@akay.id">support@akay.id</a> dengan melampirkan bukti data toko untuk proses aktivasi.
        </p>
      </section>
    </div>
  );
}
