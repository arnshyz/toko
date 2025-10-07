import nodemailer, { Transporter } from "nodemailer";

let cachedTransport: Transporter | null | undefined;

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

export async function sendPasswordResetOtpEmail(params: {
  email: string;
  name?: string | null;
  otp: string;
}): Promise<void> {
  const { email, name, otp } = params;
  const subject = "Kode OTP Reset Password";
  const greeting = name ? `Halo ${name},` : "Halo,";
  const text = `${greeting}

Gunakan kode OTP berikut untuk mereset password akun Anda: ${otp}.
Kode ini berlaku selama 15 menit.

Jika Anda tidak meminta reset password, abaikan email ini.`;
  const html = `
    <p>${greeting}</p>
    <p>Gunakan kode OTP berikut untuk mereset password akun Anda:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p>
    <p>Kode ini berlaku selama 15 menit.</p>
    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
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
  const totalDisplay = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(total);
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
