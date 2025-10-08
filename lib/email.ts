import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import { renderTemplate } from "@/lib/email-template";

import { PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES } from "@/lib/password-reset";

let cachedTransport: Transporter | null | undefined;

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatCurrencyIDR(value: number) {
  return currencyFormatter.format(value);
}

const DEFAULT_BANK_NAME = process.env.PAYMENT_BANK_NAME ?? "BCA";
const DEFAULT_BANK_ACCOUNT = process.env.PAYMENT_BANK_ACCOUNT ?? "1234567890";
const DEFAULT_BANK_HOLDER = process.env.PAYMENT_ACCOUNT_NAME ?? "PT Akay Nusantara";

function resolveTransport(): Transporter | null {
  if (cachedTransport !== undefined) {
    return cachedTransport;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    cachedTransport = null;
    console.warn("SMTP configuration missing. Emails will be logged to console.");
    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransport;
}

export type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transporter = resolveTransport();
  const from = process.env.SMTP_FROM ?? "Toko Nusantara <no-reply@example.com>";

  if (!transporter) {
    console.info("[Email Preview]", { ...options, from });
    return;
  }

  await transporter.sendMail({
    from,
    ...options,
  });
}

export async function sendPasswordResetLinkEmail(params: {
  email: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes?: number;
}): Promise<void> {
  const { email, name, resetUrl, expiresInMinutes = PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES } = params;

  const subject = "Link Reset Password";

  const expiryDate = new Date(Date.now() + expiresInMinutes * 60_000);
  const expiryLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(expiryDate);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/reset-password.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name ?? "",
      reset_url: resetUrl,
      link_expires_in: `${expiresInMinutes} menit`,
      expiry_datetime_local: expiryLocal,
      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://www.akay.web.id/privacy",
      help_center_url: "https://www.akay.web.id/help",
      support_url: "https://www.akay.web.id/support",
      year: String(new Date().getFullYear()),
      request_id: crypto.randomUUID(),        // opsional
      user_email: email,                       // opsional
      device_fingerprint: "Web • ID",         // opsional
    }
  );

  const text =
    `Halo ${name ?? ""}\n\n` +
    `Kami menerima permintaan reset password. ` +
    `Klik tautan berikut (berlaku ${expiresInMinutes} menit):\n${resetUrl}\n\n` +
    `Jika ini bukan Anda, abaikan email ini.`;

  await sendMail({ to: email, subject, text, html });
}

export async function sendPasswordResetSuccessEmail(params: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const { email, name } = params;
  const subject = "Password Berhasil Direset";
  const greeting = name ? `Halo ${name},` : "Halo,";
  const text = `${greeting}

Password akun Toko Nusantara Anda telah berhasil diperbarui.
Jika perubahan ini bukan Anda, segera hubungi tim dukungan kami.`;
  const html = `
    <p>${greeting}</p>
    <p>Password akun Toko Nusantara Anda telah berhasil diperbarui.</p>
    <p>Jika perubahan ini bukan Anda, segera hubungi tim dukungan kami.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendRegistrationSuccessEmail(params: {
  email: string;
  name: string;
}): Promise<void> {
  const { email, name } = params;
  const subject = "Registrasi Berhasil";
  const greeting = `Halo ${name},`;
  const text = `${greeting}

Selamat! Akun Toko Nusantara Anda berhasil dibuat. Silakan login untuk mulai mengelola toko Anda.

Salam,
Tim Toko Nusantara`;
  const html = `
    <p>${greeting}</p>
    <p>Selamat! Akun Toko Nusantara Anda berhasil dibuat. Silakan login untuk mulai mengelola toko Anda.</p>
    <p>Salam,<br/>Tim Toko Nusantara</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

type OrderEmailBase = {
  email: string;
  name: string;
  orderCode: string;
};

export async function sendOrderCreatedEmail(params: OrderEmailBase & {
  paymentMethod: string;
  total: number;
}): Promise<void> {
  const { email, name, orderCode, paymentMethod, total } = params;
  const subject = `Pesanan ${orderCode} berhasil dibuat`;
  const greeting = `Halo ${name},`;
  const paymentLabel = paymentMethod === "COD" ? "COD (Bayar di Tempat)" : "Transfer Manual";
  const totalDisplay = formatCurrencyIDR(total);
  const text = `${greeting}

Terima kasih telah berbelanja di Toko Nusantara. Pesanan Anda dengan kode ${orderCode} berhasil dibuat.
Metode pembayaran: ${paymentLabel}.
Total tagihan: ${totalDisplay}.

Anda dapat memantau status pesanan melalui halaman order kami.

Salam,
Tim Toko Nusantara`;
  const html = `
    <p>${greeting}</p>
    <p>Terima kasih telah berbelanja di Toko Nusantara. Pesanan Anda dengan kode <strong>${orderCode}</strong> berhasil dibuat.</p>
    <p>Metode pembayaran: <strong>${paymentLabel}</strong><br/>Total tagihan: <strong>${totalDisplay}</strong></p>
    <p>Anda dapat memantau status pesanan melalui halaman order kami.</p>
    <p>Salam,<br/>Tim Toko Nusantara</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendOrderShippedEmail(params: OrderEmailBase): Promise<void> {
  const { email, name, orderCode } = params;
  const subject = `Pesanan ${orderCode} sedang dikirim`;
  const greeting = `Halo ${name},`;
  const text = `${greeting}

Pesanan Anda dengan kode ${orderCode} telah dikirim oleh penjual. Silakan pantau proses pengiriman sampai barang diterima.

Salam,
Tim Toko Nusantara`;
  const html = `
    <p>${greeting}</p>
    <p>Pesanan Anda dengan kode <strong>${orderCode}</strong> telah dikirim oleh penjual. Silakan pantau proses pengiriman sampai barang diterima.</p>
    <p>Salam,<br/>Tim Toko Nusantara</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendPaymentSuccessEmail(params: OrderEmailBase): Promise<void> {
  const { email, name, orderCode } = params;
  const subject = `Pembayaran pesanan ${orderCode} berhasil diverifikasi`;
  const greeting = `Halo ${name},`;
  const text = `${greeting}

Pembayaran untuk pesanan ${orderCode} telah kami terima dan verifikasi. Pesanan sedang diproses oleh penjual.

Salam,
Tim Toko Nusantara`;
  const html = `
    <p>${greeting}</p>
    <p>Pembayaran untuk pesanan <strong>${orderCode}</strong> telah kami terima dan verifikasi. Pesanan sedang diproses oleh penjual.</p>
    <p>Salam,<br/>Tim Toko Nusantara</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendOrderCompletedEmail(params: OrderEmailBase): Promise<void> {
  const { email, name, orderCode } = params;
  const subject = `Pesanan ${orderCode} selesai`;
  const greeting = `Halo ${name},`;
  const text = `${greeting}

Selamat! Semua item pada pesanan ${orderCode} telah diterima. Terima kasih sudah berbelanja di Toko Nusantara.

Kami berharap dapat melayani Anda kembali.

Salam,
Tim Toko Nusantara`;
  const html = `
    <p>${greeting}</p>
    <p>Selamat! Semua item pada pesanan <strong>${orderCode}</strong> telah diterima. Terima kasih sudah berbelanja di Toko Nusantara.</p>
    <p>Kami berharap dapat melayani Anda kembali.</p>
    <p>Salam,<br/>Tim Toko Nusantara</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendOrderProcessingEmail(params: OrderEmailBase & {
  estimatedShipping?: string | Date | null;
}): Promise<void> {
  const { email, name, orderCode, estimatedShipping } = params;
  const subject = `Pesanan ${orderCode} sedang diproses`;
  const greeting = `Halo ${name},`;
  const estimateText = estimatedShipping
    ? `Perkiraan pengiriman pada ${new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
      }).format(typeof estimatedShipping === "string" ? new Date(estimatedShipping) : estimatedShipping)}.`
    : "Pesanan Anda sedang kami siapkan untuk dikirim.";

  const text = `${greeting}

Pesanan Anda dengan kode ${orderCode} sedang diproses oleh penjual.
${estimateText}

Kami akan mengirimkan notifikasi tambahan setelah paket dikirim.`;

  const html = `
    <p>${greeting}</p>
    <p>Pesanan Anda dengan kode <strong>${orderCode}</strong> sedang diproses oleh penjual.</p>
    <p>${estimateText}</p>
    <p>Kami akan mengirimkan notifikasi tambahan setelah paket dikirim.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendOrderCancelledEmail(params: OrderEmailBase & {
  reason?: string | null;
}): Promise<void> {
  const { email, name, orderCode, reason } = params;
  const subject = `Pesanan ${orderCode} dibatalkan`;
  const greeting = `Halo ${name},`;
  const extra = reason ? `Alasan pembatalan: ${reason}` : "Pesanan dibatalkan oleh admin atau penjual.";

  const text = `${greeting}

Pesanan dengan kode ${orderCode} telah dibatalkan.
${extra}

Jika Anda sudah melakukan pembayaran, tim kami akan membantu proses pengembalian dana.`;

  const html = `
    <p>${greeting}</p>
    <p>Pesanan dengan kode <strong>${orderCode}</strong> telah dibatalkan.</p>
    <p>${extra}</p>
    <p>Jika Anda telah melakukan pembayaran, kami akan membantu proses pengembalian dana sesuai prosedur.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

export async function sendOrderPaymentPendingEmail(params: OrderEmailBase & {
  paymentMethod: string;
  total: number;
  uniqueCode?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentInstructions?: string | null;
  dueDate?: Date | string | null;
}): Promise<void> {
  const {
    email,
    name,
    orderCode,
    paymentMethod,
    total,
    uniqueCode,
    bankName = DEFAULT_BANK_NAME,
    bankAccountNumber = DEFAULT_BANK_ACCOUNT,
    bankAccountName = DEFAULT_BANK_HOLDER,
    paymentInstructions,
    dueDate,
  } = params;

  const subject = `Menunggu pembayaran pesanan ${orderCode}`;
  const greeting = `Halo ${name},`;
  const totalDisplay = formatCurrencyIDR(total);
  const uniqueCodeDisplay = typeof uniqueCode === "number" && uniqueCode > 0 ? `${uniqueCode}` : null;
  const dueDisplay = dueDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(
        typeof dueDate === "string" ? new Date(dueDate) : dueDate,
      )
    : null;
  const instructionText =
    paymentInstructions ??
    `Transfer manual melalui ${bankName} ke nomor rekening ${bankAccountNumber} a.n ${bankAccountName}. Setelah pembayaran, unggah bukti di halaman pesanan.`;

  const textLines = [
    greeting,
    "",
    `Pesanan Anda dengan kode ${orderCode} berhasil dibuat dan menunggu pembayaran (${paymentMethod}).`,
    `Total yang harus dibayar: ${totalDisplay}.`,
    instructionText,
  ];
  if (uniqueCodeDisplay) {
    textLines.push(`Kode unik pembayaran: ${uniqueCodeDisplay}`);
  }
  if (dueDisplay) {
    textLines.push(`Selesaikan pembayaran sebelum ${dueDisplay}.`);
  }
  textLines.push("Terima kasih telah berbelanja di Akay Nusantara.");

  const text = textLines.join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Pesanan Anda dengan kode <strong>${orderCode}</strong> berhasil dibuat dan menunggu pembayaran (<strong>${paymentMethod}</strong>).</p>
    <p>Total yang harus dibayar: <strong>${totalDisplay}</strong></p>
    <ul>
      <li>Bank: <strong>${bankName}</strong></li>
      <li>Nomor Rekening: <strong>${bankAccountNumber}</strong></li>
      <li>Atas Nama: <strong>${bankAccountName}</strong></li>
      ${uniqueCodeDisplay ? `<li>Kode unik pembayaran: <strong>${uniqueCodeDisplay}</strong></li>` : ""}
    </ul>
    <p>${instructionText}</p>
    ${dueDisplay ? `<p>Selesaikan pembayaran sebelum <strong>${dueDisplay}</strong>.</p>` : ""}
    <p>Terima kasih telah berbelanja di Akay Nusantara.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}
