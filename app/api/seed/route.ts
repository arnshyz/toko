import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@akay.id").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: 'Admin Akay',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPass, 10),
        slug: slugify('Admin Akay'),
        isAdmin: true
      }
    });
  }
  // sample voucher
  const v = await prisma.voucher.findUnique({ where: { code: 'AKAY10' } });
  if (!v) {
    await prisma.voucher.create({ data: { code: 'AKAY10', kind: 'PERCENT', value: 10, minSpend: 100000, active: true } });
  }

  const bannerCount = await prisma.promoBanner.count();
  if (bannerCount === 0) {
    await prisma.promoBanner.createMany({
      data: [
        {
          title: 'Promo Spesial Minggu Ini',
          description: 'Nikmati potongan harga hingga 40% untuk produk pilihan.',
          highlight: 'Diskon Terbatas',
          imageUrl: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
          ctaLabel: 'Belanja Sekarang',
          ctaHref: '/product',
          sortOrder: 0,
          isActive: true,
        },
        {
          title: 'Gratis Ongkir ke Seluruh Indonesia',
          description: 'Belanja sekarang dan dapatkan pengiriman gratis tanpa minimum belanja.',
          highlight: 'Ongkir 0 Rupiah',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
          ctaLabel: 'Lihat Promo',
          ctaHref: '/product',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: 'Flash Sale Setiap Hari',
          description: 'Produk favorit dengan harga spesial hadir setiap hari jam 12.00-15.00.',
          highlight: '3 Jam Saja',
          imageUrl: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80',
          ctaLabel: 'Ikuti Flash Sale',
          ctaHref: '/product',
          sortOrder: 2,
          isActive: true,
        },
      ],
    });
  }
  return NextResponse.json({ ok: true });
}
