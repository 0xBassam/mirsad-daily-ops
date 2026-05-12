import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getSystemSettings } from '../models/SystemSettings';
import nodemailer from 'nodemailer';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const safe = settings.toObject() as any;
  if (safe.smtpPass) safe.smtpPass = '••••••••';
  res.json({ success: true, data: safe });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const { smtpPass, ...rest } = req.body;

  Object.assign(settings, rest);
  if (smtpPass && smtpPass !== '••••••••') {
    settings.smtpPass = smtpPass;
  }
  await settings.save();

  const { clearTransporterCache } = await import('../services/emailService');
  clearTransporterCache();

  const safe = settings.toObject() as any;
  if (safe.smtpPass) safe.smtpPass = '••••••••';
  res.json({ success: true, data: safe });
});

// Translate raw nodemailer/Node errors into readable one-liners
function readableSmtpError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)) || 'Unknown error';
  if (/ENOTFOUND/.test(msg)) {
    const host = msg.match(/ENOTFOUND\s+(\S+)/)?.[1] ?? 'the SMTP host';
    return `Cannot resolve hostname "${host}" — check the SMTP host setting`;
  }
  if (/ECONNREFUSED/.test(msg)) return `Connection refused — wrong host or port`;
  if (/ETIMEDOUT|timed out/i.test(msg)) return `Connection timed out — server did not respond within 10 seconds`;
  if (/535|Authentication unsuccessful|Invalid credentials/i.test(msg))
    return `Authentication failed — check username and password`;
  if (/530|Must issue a STARTTLS/i.test(msg))
    return `Server requires STARTTLS — enable TLS in settings`;
  if (/454|TLS not available/i.test(msg))
    return `Server rejected TLS — try disabling TLS or contact your provider`;
  if (/certificate|CERT/i.test(msg))
    return `TLS certificate error — ${msg}`;
  if (/550|553|relay/i.test(msg))
    return `Relay denied — check that this sender address is allowed`;
  return msg;
}

export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) throw new AppError('Recipient email is required', 400);

  const settings = await getSystemSettings();
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new AppError('SMTP is not configured — fill in host, username, and password first', 400);
  }

  const port = settings.smtpPort || 587;
  // Port 465 = implicit TLS (secure:true). Port 587/25 = STARTTLS (secure:false + requireTLS).
  const implicitTls = port === 465;
  const requireTLS   = settings.smtpTls && !implicitTls;

  const transporter = nodemailer.createTransport({
    host:              settings.smtpHost,
    port,
    secure:            implicitTls,
    requireTLS,
    connectionTimeout: 8_000,
    greetingTimeout:   8_000,
    socketTimeout:     8_000,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });

  const TIMEOUT_MS = 10_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Connection timed out — server did not respond within 10 seconds')), TIMEOUT_MS)
  );

  try {
    await Promise.race([
      transporter.sendMail({
        from: `"${settings.smtpFromName || 'Mirsad'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
        to,
        subject: 'Mirsad – SMTP Test',
        html: `<p>SMTP configuration test from Mirsad. Host: <strong>${settings.smtpHost}:${port}</strong>. If you received this, your settings are correct.</p>`,
      }),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error('[testEmail] SMTP error:', err);
    const message = readableSmtpError(err);
    throw new AppError(message, 502);
  }

  res.json({ success: true, message: `Test email sent to ${to}` });
});

