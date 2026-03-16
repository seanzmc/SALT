import "server-only";

import nodemailer from "nodemailer";

type PasswordResetEmailArgs = {
  email: string;
  name: string;
  resetUrl: string;
};

function getTransport() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  return null;
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl
}: PasswordResetEmailArgs) {
  const transport = getTransport();

  if (!transport) {
    console.info(`[password-reset] No SMTP transport configured. Reset link for ${email}: ${resetUrl}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@example.com",
    to: email,
    subject: "Reset your password",
    text: `Hi ${name},\n\nUse the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Use the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request a password reset, you can ignore this email.</p>`
  });
}
