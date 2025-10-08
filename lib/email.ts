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

export async function sendOrderCreatedEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay?: string;         // contoh: Rp120.000
  total?: number;
  paymentMethod?: string;        // contoh: Transfer Manual
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  uniqueCode?: string | number | null;
  dueDate?: Date | string | null;
  orderUrl?: string;
  paymentInstructions?: string | null;
}) {
  const {
    email,
    name,
    orderCode,
    totalDisplay,
    total = null,
    paymentMethod = "Transfer Manual",
    bankName = "BCA",
    bankAccount = "5065223446",
    bankHolder = "Lubis Karisma Ariansyah",
    uniqueCode = "",
    dueDate = null,
    orderUrl: orderUrlParam = "#",
    paymentInstructions,
  } = params;

  const totalDisplayValue =
    totalDisplay ?? (typeof total === "number" ? formatCurrencyIDR(total) : "—");
  const orderUrl = orderUrlParam ?? "#";
  const uniqueCodeDisplay =
    typeof uniqueCode === "number" ? String(uniqueCode) : uniqueCode ?? "";
  const paymentInstructionsDisplay =
    paymentInstructions ??
    `Transfer ke ${bankName ?? ""} ${bankAccount ?? ""} a.n ${bankHolder ?? ""}, lalu unggah bukti di halaman pesanan.`;

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
      total_display: totalDisplayValue,
      payment_method: paymentMethod,
      bank_name: bankName ?? "",
      bank_account: bankAccount ?? "",
      bank_holder: bankHolder ?? "",
      unique_code: uniqueCodeDisplay,
      due_date_local: dueLocal,
      payment_instructions: paymentInstructionsDisplay,
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
      `Halo ${name}, pesanan ${orderCode} berhasil dibuat. Total ${totalDisplayValue}. ` +
      `Metode ${paymentMethod}. Lihat status: ${orderUrl}`,
    html,
  });
}
export async function sendPaymentSuccessEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  amountDisplay?: string;     // contoh: Rp120.000
  paymentMethod?: string;     // contoh: BCA Transfer
  paidAt?: Date | string;     // waktu pembayaran
  orderUrl?: string;
  paymentId?: string;
}) {
  const {
    email,
    name,
    orderCode,
    amountDisplay = "—",
    paymentMethod = "",
    paidAt = new Date(),
    orderUrl: orderUrlParam = "#",
    paymentId = "",
  } = params;

  const paidLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof paidAt === "string" ? new Date(paidAt) : paidAt);

  const orderUrlDisplay = orderUrlParam ?? "#";
  const paymentMethodDisplay = paymentMethod || "Transfer";
  const paymentIdDisplay = paymentId ?? "";

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/payment-success.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      amount_display: amountDisplay,
      payment_method: paymentMethodDisplay,
      paid_at_local: paidLocal,
      payment_id: paymentIdDisplay,
      order_url: orderUrlDisplay,

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
      `dengan metode ${paymentMethodDisplay} telah kami terima. Lihat status: ${orderUrlDisplay}`,
    html,
  });
}

export async function sendOrderCompletedEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay?: string;          // Rp120.000
  completedAt?: Date | string;
  orderUrl?: string;
  reviewUrl?: string;
  itemsRowsHtml?: string;        // <tr><td>Produk A</td><td align="right">1×</td><td align="right">Rp50.000</td></tr>
}) {
  const {
    email, name, orderCode,
    totalDisplay = "—",
    completedAt = new Date(),
    orderUrl: orderUrlParam = "#",
    reviewUrl: reviewUrlParam,
    itemsRowsHtml = "",
  } = params;

  const orderUrlDisplay = orderUrlParam ?? "#";
  const reviewUrlDisplay = reviewUrlParam ?? `${orderUrlDisplay}#review`;

  const completedLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof completedAt === "string" ? new Date(completedAt) : completedAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-completed.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      total_display: totalDisplay,
      completed_at_local: completedLocal,
      order_url: orderUrlDisplay,
      review_url: reviewUrlDisplay,
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
      `Total ${totalDisplay}. Detail: ${orderUrlDisplay}`,
    html,
  });
}

export async function sendOrderProcessingEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  orderUrl?: string;
  estimatedShipping?: Date | string | null;
  updatedAt?: Date | string;
  itemsRowsHtml?: string;
}) {
  const {
    email, name, orderCode,
    orderUrl: orderUrlParam = "#",
    estimatedShipping = null,
    updatedAt = new Date(),
    itemsRowsHtml = "",
  } = params;

  const orderUrlDisplay = orderUrlParam ?? "#";

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
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,
      order_code: orderCode,
      order_url: orderUrlDisplay,
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
      `Perkiraan kirim: ${estimatedLocal}. Lihat status: ${orderUrlDisplay}`,
    html,
  });
}

export async function sendOrderShippedEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: Date | string;
  orderUrl?: string | null;
  itemsRowsHtml?: string;
}) {
  const {
    email,
    name,
    orderCode,
    courier = "",
    trackingNumber = "",
    trackingUrl = null,
    shippedAt = new Date(),
    orderUrl = "#",
    itemsRowsHtml = "",
  } = params;

  const shippedLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof shippedAt === "string" ? new Date(shippedAt) : shippedAt);

  const courierDisplay = courier ?? "";
  const trackingNumberDisplay = trackingNumber ?? "";
  const trackingUrlDisplay = trackingUrl ?? "";
  const orderUrlDisplay = orderUrl ?? "#";

  const shipmentSummary = [courierDisplay, trackingNumberDisplay]
    .filter((value) => value && value.trim())
    .join(" • ");

  const htmlSections = [
    `<p>Halo ${name},</p>`,
    `<p>Pesanan ${orderCode} telah dikirim pada ${shippedLocal}.</p>`,
  ];

  if (shipmentSummary) {
    htmlSections.push(`<p>Detail pengiriman: ${shipmentSummary}</p>`);
  }

  if (trackingUrlDisplay) {
    htmlSections.push(
      `<p>Lacak pengiriman: <a href="${trackingUrlDisplay}">${trackingUrlDisplay}</a></p>`
    );
  }

  htmlSections.push(
    `<p>Lihat status pesanan: <a href="${orderUrlDisplay}">${orderUrlDisplay}</a></p>`
  );

  if (itemsRowsHtml.trim()) {
    htmlSections.push(
      `<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-top: 16px;">${itemsRowsHtml}</table>`
    );
  }

  const html = htmlSections.join("\n");

  const textLines = [
    `Halo ${name},`,
    ``,
    `Pesanan ${orderCode} telah dikirim pada ${shippedLocal}.`,
  ];

  if (shipmentSummary) {
    textLines.push(`Detail pengiriman: ${shipmentSummary}`);
  }

  if (trackingUrlDisplay) {
    textLines.push(`Lacak pengiriman: ${trackingUrlDisplay}`);
  }

  textLines.push(`Lihat status pesanan: ${orderUrlDisplay}`);

  const text = textLines.join("\n");

  await sendMail({
    to: email,
    subject: `Pesanan ${orderCode} sedang dikirim`,
    text,
    html,
  });
}

export async function sendOrderCancelledEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay?: string;          // Rp120.000
  reason?: string | null;
  cancelledAt?: Date | string;
  orderUrl?: string;
  refundAmountDisplay?: string;   // jika ada refund
  refundMethod?: string;          // contoh: Transfer bank
  refundReference?: string;       // contoh: RFD-123
}) {
  const {
    email, name, orderCode,
    orderUrl: orderUrlParam = "#",
    totalDisplay = "—",
    reason = "Pembatalan oleh admin/penjual",
    cancelledAt = new Date(),
    refundAmountDisplay = "",
    refundMethod = "",
    refundReference = ""
  } = params;

  const orderUrlDisplay = orderUrlParam ?? "#";
  const cancellationReason = reason ?? "Pembatalan oleh admin/penjual";
  const refundAmount = refundAmountDisplay ?? "";
  const refundMethodDisplay = refundMethod ?? "";
  const refundReferenceDisplay = refundReference ?? "";

  const cancelledLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof cancelledAt === "string" ? new Date(cancelledAt) : cancelledAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-cancelled.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,

      order_code: orderCode,
      total_display: totalDisplay,
      cancelled_at_local: cancelledLocal,
      order_url: orderUrlDisplay,
      cancellation_reason: cancellationReason,

      refund_amount_display: refundAmount,
      refund_method: refundMethodDisplay,
      refund_reference: refundReferenceDisplay,

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
      `Alasan: ${cancellationReason}. Detail: ${orderUrlDisplay}`,
    html,
  });
}

export async function sendOrderPaymentPendingEmail(params: {
  email: string;
  name: string;
  orderCode: string;
  totalDisplay?: string;          // Rp120.000
  total?: number;
  paymentMethod?: string;         // Transfer Manual / VA
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  vaNumber?: string | null;
  uniqueCode?: string | number | null;
  dueDate?: Date | string | null;
  payUrl?: string;
  orderUrl?: string;
  paymentInstructions?: string | null;
}) {
  const {
    email,
    name,
    orderCode,
    totalDisplay,
    total = null,
    paymentMethod = "Transfer Manual",
    bankName = "BCA",
    bankAccount = "5065223446",
    bankHolder = "Lubis Karisma Ariansyah",
    vaNumber = "",
    uniqueCode = "",
    dueDate = null,
    payUrl: payUrlParam = "#",
    orderUrl: orderUrlParam = "#",
    paymentInstructions,
  } = params;

  const totalDisplayValue =
    totalDisplay ?? (typeof total === "number" ? formatCurrencyIDR(total) : "—");
  const payUrl = payUrlParam ?? "#";
  const orderUrl = orderUrlParam ?? "#";
  const uniqueCodeDisplay =
    typeof uniqueCode === "number" ? String(uniqueCode) : uniqueCode ?? "";
  const paymentInstructionsDisplay =
    paymentInstructions ??
    `Transfer ke ${bankName ?? ""} ${bankAccount ?? ""} a.n ${bankHolder ?? ""}, lalu unggah bukti di halaman pesanan.`;

  const dueLocal = dueDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" })
        .format(typeof dueDate === "string" ? new Date(dueDate) : dueDate)
    : "—";

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/order-payment-pending.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,

      order_code: orderCode,
      total_display: totalDisplayValue,
      payment_method: paymentMethod,
      bank_name: bankName ?? "",
      bank_account: bankAccount ?? "",
      bank_holder: bankHolder ?? "",
      va_number: vaNumber ?? "",
      unique_code: uniqueCodeDisplay,
      due_date_local: dueLocal,
      payment_instructions: paymentInstructionsDisplay,

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
      `Halo ${name}, pesanan ${orderCode} menunggu pembayaran. Total ${totalDisplayValue}. ` +
      `Metode ${paymentMethod}. Bayar: ${payUrl} • Status: ${orderUrl}`,
    html,
  });
}


export async function sendLoginNotificationEmail(params: {
  email: string;
  name: string;
  loginAt?: Date | string;
  ipAddress?: string;
  device?: string;
  location?: string;                 // contoh: Sidoarjo, ID
  isNewDevice?: boolean;
  activityUrl: string;               // halaman riwayat/aktivitas login
  resetPasswordUrl: string;
  securityUrl: string;               // halaman keamanan akun
}) {
  const {
    email, name,
    loginAt = new Date(),
    ipAddress = "",
    device = "",
    location = "Tidak diketahui",
    isNewDevice = false,
    activityUrl,
    resetPasswordUrl,
    securityUrl,
  } = params;

  const loginLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof loginAt === "string" ? new Date(loginAt) : loginAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/login-notification.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name,
      user_email: email,

      login_at_local: loginLocal,
      ip_address: ipAddress,
      device,
      location,
      is_new_device: isNewDevice ? "Ya" : "Tidak",

      activity_url: activityUrl,
      reset_password_url: resetPasswordUrl,
      security_url: securityUrl,

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
    subject: "Notifikasi login ke akun Anda",
    text:
      `Halo ${name}, ada login ke akun Anda pada ${loginLocal}. ` +
      `IP: ${ipAddress} • Perangkat: ${device} • Lokasi: ${location}. ` +
      `Aktivitas: ${activityUrl} • Ganti sandi: ${resetPasswordUrl}`,
    html,
  });
}

export async function sendPasswordResetSuccessEmail(params: {
  email: string;
  name?: string | null;
  loginUrl?: string;
  securityUrl?: string;
  resetPasswordUrl?: string;
  changedAt?: Date | string;
  deviceFingerprint?: string;
}) {
  const {
    email,
    name = null,
    loginUrl: loginUrlParam,
    securityUrl: securityUrlParam,
    resetPasswordUrl: resetPasswordUrlParam,
    changedAt = new Date(),
    deviceFingerprint = "Web • ID",
  } = params;

  const subject = "Password berhasil diperbarui";

  const loginUrl =
    loginUrlParam ?? process.env.NEXT_PUBLIC_APP_LOGIN_URL ?? process.env.APP_LOGIN_URL ?? "#";
  const securityUrl =
    securityUrlParam ?? process.env.NEXT_PUBLIC_APP_SECURITY_URL ?? process.env.APP_SECURITY_URL ?? "#";
  const resetPasswordUrl =
    resetPasswordUrlParam ?? process.env.NEXT_PUBLIC_APP_RESET_PASSWORD_URL ?? loginUrl;

  const changedLocal = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(typeof changedAt === "string" ? new Date(changedAt) : changedAt);

  const html = await renderTemplate(
    path.join(process.cwd(), "templates/password-reset-success.html"),
    {
      app_name: "AKAY NUSANTARA",
      user_salutation: "Kak, ",
      user_name: name ?? "",
      user_email: email,
      changed_at_local: changedLocal,
      device_fingerprint: deviceFingerprint,

      login_url: loginUrl,
      security_url: securityUrl,
      reset_password_url: resetPasswordUrl,

      activity_id: crypto.randomUUID(), // opsional

      brand_logo_url: process.env.BRAND_LOGO_URL ?? "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFPWdo1aGRGXE22EIOHRGm-GMSnQlM4Ipq3hElGWDlKkvFreUP3j-KpC_clppmgqtQFE5Sky78ZndhW8bcJfdpBKqqI3YkaUYoUqDmYqN-moRfDXBLr3KNueZ_OQ-QRytSdzn7rD36NkOtb-qoEfdLZs50eg8Eum1pssd5Fzq7xSzzdoQA3zU-PHGI4k/s1600/4%20%281%29.png",
      company_name: "PT AKAY NUSANTARA GROUP",
      company_address_line: "Jl. Anjay No. 404, Sidoarjo",
      privacy_url: "https://akay.web.id/privacy",
      help_center_url: "https://akay.web.id/help",
      support_url: "https://akay.web.id/support",
      year: String(new Date().getFullYear()),
    }
  );

  const text =
    `${name ? `Halo ${name},` : "Halo,"}\n\n` +
    `Kata sandi akun Anda telah berhasil diperbarui pada ${changedLocal}.\n` +
    `Jika ini bukan Anda, segera ganti kata sandi: ${resetPasswordUrl} dan tinjau keamanan: ${securityUrl}.\n` +
    `Masuk: ${loginUrl}`;

  await sendMail({ to: email, subject, text, html });
}
