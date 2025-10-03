# Akay Nusantara — Next.js 14 + Prisma (Neon) + Vercel

Marketplace ala Shopee dengan **transfer manual + kode unik**, **COD**, **voucher**, **multi-gudang**, dan **retur per item**, plus **upload bukti transfer** & **log verifikasi**.

## Fitur
- **Pembayaran**: TRANSFER (kode unik 111–999) & COD (tanpa kode unik)
- **Voucher**: percent/fixed, min spend, expiry, active
- **Multi-gudang**: produk dapat di-assign ke gudang seller; ongkir dihitung **per gudang** (per-shipment)
- **Retur** per item: buyer ajukan, seller approve/reject (extendable: RECEIVED/REFUND)
- **WhatsApp** auto-template untuk konfirmasi transfer
- **Admin**: mark order paid

## Setup Lokal
1. Buat DB Neon → ambil `DATABASE_URL` (SSL).
2. Salin `.env.example` → `.env` dan isi variabel.
3. Install & migrasi:
   ```bash
   npm install
   npx prisma migrate dev -n "init"
   npm run dev
   ```
4. Seed admin & voucher:
   - Buka `http://localhost:3000/api/seed`
   - Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   - Voucher contoh: `AKAY10` (10% min Rp100.000)

## Deploy Vercel
- Set ENV: `DATABASE_URL`, `IRON_SESSION_PASSWORD`, `PLATFORM_NAME`, `BANK_*`, `ACCOUNT_NAME`, `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Build: `npm run build`
- Buka `/api/seed` sekali setelah deploy.

## Route Ringkas
- Public: `/`, `/product/[id]`, `/cart`, `/checkout`, `/order/[code]`, `/s/[slug]`
- Seller: `/seller/login`, `/seller/register`, `/seller/dashboard`, `/seller/products`, `/seller/orders`, `/seller/warehouses`, `/seller/returns`
- Admin: `/admin/orders`
- API: lihat `/app/api/*`

> Bukti transfer disimpan sebagai **Bytes**. Untuk skala besar, gunakan **Vercel Blob/S3/Cloudinary**.
