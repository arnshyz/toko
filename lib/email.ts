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
  loginUrl: string;
}) {
  const { email, name, loginUrl } = params;

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/registration-success.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak,",
      user_name: name,
      user_email: email,
      account_id: crypto.randomUUID(), // opsional
      login_url: loginUrl,
      activated_datetime_local: new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date()),
      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: "Registrasi akun berhasil",
    text: `Halo ${name}, akun Toko Nusantara Anda sudah aktif. Masuk: ${loginUrl}`,
    html,
  });
}

type OrderEmailBase = {
  email: string;
  name: string;
  orderCode: string;
};

export async function sendOrderCreatedEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay: string;         // contoh: Rp120.000
  paymentMethod: string;        // contoh: Transfer Manual
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  uniqueCode?: string;
  dueDate?: Date | string | null;
  orderUrl: string;
}) {
  const {
    email, name, orderCode, totalDisplay, paymentMethod, bankName = "BCA",
    bankAccount = "5065223446", bankHolder = "Lubis Karisma Ariansyah",
    uniqueCode = "", dueDate = null, orderUrl
  } = params;

  const dueLocal = dueDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" })
        .format(typeof dueDate === "string" ? new Date(dueDate) : dueDate)
    : "—";

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-created.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak,",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      total_display: totalDisplay,
      payment_method: paymentMethod,
      bank_name: bankName,
      bank_account: bankAccount,
      bank_holder: bankHolder,
      unique_code: uniqueCode,
      due_date_local: dueLocal,
      payment_instructions:
        `Transfer ke ${bankName} ${bankAccount} a.n ${bankHolder}, lalu unggah bukti di halaman pesanan.`,
      order_url: orderUrl,
      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Pesanan ${orderCode} berhasil dibuat`,
    text:
      `Halo ${name}, pesanan ${orderCode} berhasil dibuat. Total ${totalDisplay}. ` +
      `Metode ${paymentMethod}. Lihat status: ${orderUrl}`,
    html,
  });
}
export async function sendPaymentSuccessEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  amountDisplay: string;     // contoh: Rp120.000
  paymentMethod: string;     // contoh: BCA Transfer
  paidAt?: Date | string;    // waktu pembayaran
  orderUrl: string;
  paymentId?: string;
}) {
  const {
    email, name, orderCode, amountDisplay, paymentMethod,
    paidAt = new Date(), orderUrl, paymentId = ""
  } = params;

  const paidLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof paidAt === "string" ? new Date(paidAt) : paidAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/payment-success.html"),
    {
      app_name: "Toko Nusantara",
      user_salutation: "Sdr/i",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      amount_display: amountDisplay,
      payment_method: paymentMethod,
      paid_at_local: paidLocal,
      payment_id: paymentId,
      order_url: orderUrl,

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Pembayaran pesanan ${orderCode} berhasil diverifikasi`,
    text:
      `Halo ${name}, pembayaran untuk pesanan ${orderCode} (${amountDisplay}) ` +
      `dengan metode ${paymentMethod} telah kami terima. Lihat status: ${orderUrl}`,
    html,
  });
}

export async function sendOrderCompletedEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay: string;          // Rp120.000
  completedAt?: Date | string;
  orderUrl: string;
  reviewUrl?: string;
  itemsRowsHtml?: string;        // <tr><td>Produk A</td><td align="right">1×</td><td align="right">Rp50.000</td></tr>
}) {
  const {
    email, name, orderCode, totalDisplay,
    completedAt = new Date(), orderUrl,
    reviewUrl = `${orderUrl}#review`,
    itemsRowsHtml = ""
  } = params;

  const completedLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof completedAt === "string" ? new Date(completedAt) : completedAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-completed.html"),
    {
      app_name: "Toko Nusantara",
      user_salutation: "Sdr/i",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      total_display: totalDisplay,
      completed_at_local: completedLocal,
      order_url: orderUrl,
      review_url: reviewUrl,
      items_rows_html: itemsRowsHtml,

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Pesanan ${orderCode} selesai`,
    text:
      `Halo ${name}, semua item pada pesanan ${orderCode} telah diterima. ` +
      `Total ${totalDisplay}. Detail: ${orderUrl}`,
    html,
  });
}

export async function sendOrderProcessingEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  orderUrl: string;
  estimatedShipping?: Date | string | null;
  updatedAt?: Date | string;
  itemsRowsHtml?: string;
}) {
  const {
    email, name, orderCode, orderUrl,
    estimatedShipping = null, updatedAt = new Date(),
    itemsRowsHtml = ""
  } = params;

  const estimatedLocal = estimatedShipping
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full" })
        .format(typeof estimatedShipping === "string" ? new Date(estimatedShipping) : estimatedShipping)
    : "Menunggu konfirmasi";

  const updatedLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-processing.html"),
    {
      app_name: "Toko Nusantara",
      user_salutation: "Sdr/i",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      order_url: orderUrl,
      estimated_shipping_local: estimatedLocal,
      updated_at_local: updatedLocal,
      items_rows_html: itemsRowsHtml,

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Pesanan ${orderCode} sedang diproses`,
    text:
      `Halo ${name}, pesanan ${orderCode} sedang diproses. ` +
      `Perkiraan kirim: ${estimatedLocal}. Lihat status: ${orderUrl}`,
    html,
  });
}

export async function sendOrderCancelledEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay?: string;          // Rp120.000
  reason?: string;
  cancelledAt?: Date | string;
  orderUrl: string;
  refundAmountDisplay?: string;   // jika ada refund
  refundMethod?: string;          // contoh: Transfer bank
  refundReference?: string;       // contoh: RFD-123
}) {
  const {
    email, name, orderCode, orderUrl,
    totalDisplay = "—",
    reason = "Pembatalan oleh admin/penjual",
    cancelledAt = new Date(),
    refundAmountDisplay = "",
    refundMethod = "",
    refundReference = ""
  } = params;

  const cancelledLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof cancelledAt === "string" ? new Date(cancelledAt) : cancelledAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-cancelled.html"),
    {
      app_name: "Toko Nusantara",
      user_salutation: "Sdr/i",
      user_name: name,
      user_email: email,

      order_code: orderCode,
      total_display: totalDisplay,
      cancelled_at_local: cancelledLocal,
      order_url: orderUrl,
      cancellation_reason: reason,

      refund_amount_display: refundAmountDisplay,
      refund_method: refundMethod,
      refund_reference: refundReference,

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Pesanan ${orderCode} dibatalkan`,
    text:
      `Halo ${name}, pesanan ${orderCode} telah dibatalkan. ` +
      `Alasan: ${reason}. Detail: ${orderUrl}`,
    html,
  });
}

export async function sendOrderPaymentPendingEmailHtml(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay: string;          // Rp120.000
  paymentMethod: string;         // Transfer Manual / VA
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  vaNumber?: string | null;
  uniqueCode?: string | null;
  dueDate?: Date | string | null;
  payUrl: string;
  orderUrl: string;
  paymentInstructions?: string | null;
}) {
  const {
    email, name, orderCode, totalDisplay, paymentMethod,
    bankName = "BCA", bankAccount = "1234567890", bankHolder = "PT Akay Nusantara",
    vaNumber = "", uniqueCode = "", dueDate = null, payUrl, orderUrl,
    paymentInstructions = `Transfer ke ${bankName} ${bankAccount} a.n ${bankHolder}, lalu unggah bukti di halaman pesanan.`
  } = params;

  const dueLocal = dueDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" })
        .format(typeof dueDate === "string" ? new Date(dueDate) : dueDate)
    : "—";

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-payment-pending.html"),
    {
      app_name: "Toko Nusantara",
      user_salutation: "Sdr/i",
      user_name: name,
      user_email: email,

      order_code: orderCode,
      total_display: totalDisplay,
      payment_method: paymentMethod,
      bank_name: bankName ?? "",
      bank_account: bankAccount ?? "",
      bank_holder: bankHolder ?? "",
      va_number: vaNumber ?? "",
      unique_code: uniqueCode ?? "",
      due_date_local: dueLocal,
      payment_instructions: paymentInstructions,

      pay_url: payUrl,
      order_url: orderUrl,

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  await sendMail({
    to: email,
    subject: `Menunggu pembayaran pesanan ${orderCode}`,
    text:
      `Halo ${name}, pesanan ${orderCode} menunggu pembayaran. Total ${totalDisplay}. ` +
      `Metode ${paymentMethod}. Bayar: ${payUrl} • Status: ${orderUrl}`,
    html,
  });
}
