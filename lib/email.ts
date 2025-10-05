import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null | undefined;

function resolveTransport(): nodemailer.Transporter | null {
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
