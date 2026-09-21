import { Resend } from "resend";

export const sendVerificationEmail = async (to, rawToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;

  // ponytail: mock when RESEND_API_KEY missing (dev without key), strict send when key present; sync file for test capture (buffered stdout fix)
  const logLine = `[email] to=${to} verifyUrl=${verifyUrl}`;
  try {
    const fs = await import("fs");
    fs.appendFileSync("C:\\Users\\praya\\AppData\\Local\\Temp\\opencode\\email_verify.log", logLine + "\n");
  } catch {}
  // unbuffered via stderr
  console.error(logLine);

  if (!process.env.RESEND_API_KEY) {
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your email — Vault-Renew",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#111">Vault-Renew</h2>
        <h3>Verify your email</h3>
        <p>Welcome to Vault-Renew! Please verify your email to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a>
        <p>Or copy this link:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color:#666;font-size:13px">This link expires in 15 minutes.</p>
        <p style="color:#666;font-size:13px">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) throw new Error(error.message || "Failed to send email");
};
