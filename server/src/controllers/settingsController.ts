import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getSystemSettings } from '../models/SystemSettings';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const MASK = '••••••••';

function maskSettings(obj: any): any {
  const safe = { ...obj };
  if (safe.smtpPass)    safe.smtpPass    = MASK;
  if (safe.resendApiKey) safe.resendApiKey = MASK;
  return safe;
}

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSystemSettings();
  res.json({ success: true, data: maskSettings(settings.toObject()) });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const body = req.body as Partial<{
    emailProvider: 'smtp' | 'resend';
    resendApiKey: string; resendFromEmail: string; resendFromName: string;
    smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string;
    smtpFromEmail: string; smtpFromName: string; smtpTls: boolean;
    emailAlerts: Record<string, boolean>;
  }>;

  // Set each field explicitly so Mongoose change-tracking works correctly
  if (body.emailProvider !== undefined) settings.emailProvider = body.emailProvider;
  if (body.resendFromEmail !== undefined) settings.resendFromEmail = body.resendFromEmail;
  if (body.resendFromName  !== undefined) settings.resendFromName  = body.resendFromName;
  if (body.smtpHost        !== undefined) settings.smtpHost        = body.smtpHost;
  if (body.smtpPort        !== undefined) settings.smtpPort        = body.smtpPort;
  if (body.smtpUser        !== undefined) settings.smtpUser        = body.smtpUser;
  if (body.smtpFromEmail   !== undefined) settings.smtpFromEmail   = body.smtpFromEmail;
  if (body.smtpFromName    !== undefined) settings.smtpFromName    = body.smtpFromName;
  if (body.smtpTls         !== undefined) settings.smtpTls         = body.smtpTls;
  if (body.emailAlerts     !== undefined) settings.emailAlerts     = body.emailAlerts as any;
  // Only overwrite secrets when a real value is submitted (not the mask)
  if (body.smtpPass    && body.smtpPass    !== MASK) settings.smtpPass    = body.smtpPass;
  if (body.resendApiKey && body.resendApiKey !== MASK) settings.resendApiKey = body.resendApiKey;

  console.log('[updateSettings] saving emailProvider:', settings.emailProvider);
  await settings.save();
  console.log('[updateSettings] saved. emailProvider in DB:', settings.emailProvider);

  const { clearTransporterCache } = await import('../services/emailService');
  clearTransporterCache();

  res.json({ success: true, data: maskSettings(settings.toObject()) });
});

// ─── Readable SMTP error ──────────────────────────────────────────────────────

function readableSmtpError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)) || 'Unknown error';
  if (/ENOTFOUND/.test(msg)) {
    const host = msg.match(/ENOTFOUND\s+(\S+)/)?.[1] ?? 'the SMTP host';
    return `Cannot resolve hostname "${host}" — check the SMTP host setting`;
  }
  if (/ECONNREFUSED/.test(msg)) return 'Connection refused — wrong host or port';
  if (/ETIMEDOUT|timed out/i.test(msg)) return 'Connection timed out — server did not respond within 10 seconds';
  if (/535|Authentication unsuccessful|Invalid credentials/i.test(msg))
    return 'Authentication failed — check username and password';
  if (/530|Must issue a STARTTLS/i.test(msg))
    return 'Server requires STARTTLS — enable TLS in settings';
  if (/454|TLS not available/i.test(msg))
    return 'Server rejected TLS — try disabling TLS or contact your provider';
  if (/certificate|CERT/i.test(msg)) return `TLS certificate error — ${msg}`;
  if (/550|553|relay/i.test(msg))    return 'Relay denied — check that this sender address is allowed';
  return msg;
}

// ─── Test email ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@,;'"<>]+@[^\s@,;'"<>]+\.[^\s@,;'"<>]{2,}$/;

function parseAndValidateRecipients(raw: unknown): string[] {
  // Accept either a pre-parsed array from the client or a raw string
  const list: string[] = Array.isArray(raw)
    ? raw.map(String).map(s => s.trim()).filter(Boolean)
    : String(raw).split(',').map(s => s.trim()).filter(Boolean);

  if (list.length === 0) throw new AppError('Recipient email is required', 400);

  const invalid = list.filter(e => !EMAIL_RE.test(e));
  if (invalid.length > 0)
    throw new AppError(`Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`, 400);

  return list;
}

function validateTestEmailBody(body: Record<string, unknown>): { subject: string; message: string } {
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!subject) throw new AppError('Subject is required', 400);
  if (!message) throw new AppError('Message is required', 400);
  return { subject, message };
}

export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const recipients = parseAndValidateRecipients(req.body.to);
  const { subject, message } = validateTestEmailBody(req.body);

  // Always load fresh — no cache
  const settings = await getSystemSettings();

  // emailProvider has no DB default, so undefined means "not explicitly set"
  const dbProvider  = settings.emailProvider;         // 'smtp' | 'resend' | undefined
  const envProvider = env.EMAIL_PROVIDER;             // 'smtp' | 'resend' | undefined
  const provider    = dbProvider || envProvider || 'smtp';

  console.log('[testEmail] db.emailProvider:', dbProvider);
  console.log('[testEmail] env.EMAIL_PROVIDER:', envProvider);
  console.log('[testEmail] resolved provider:', provider);
  console.log('[testEmail] db.resendApiKey set:', !!settings.resendApiKey);
  console.log('[testEmail] env.RESEND_API_KEY set:', !!env.RESEND_API_KEY);

  // ── Resend path ──────────────────────────────────────────────────────────────
  if (provider === 'resend') {
    const apiKey = settings.resendApiKey || env.RESEND_API_KEY;
    if (!apiKey) throw new AppError('Resend API key is not configured', 400);

    const fromEmail = settings.resendFromEmail || env.RESEND_FROM_EMAIL || 'alerts@stdsec.sa';
    const fromName  = settings.resendFromName  || env.RESEND_FROM_NAME  || 'Mirsad Alerts';
    const from      = `${fromName} <${fromEmail}>`;

    const client = new Resend(apiKey);
    const result = await client.emails.send({
      from,
      to: recipients,
      subject,
      html: `<p>${message}</p>`,
    });

    if (result.error) {
      console.error('[testEmail] Resend error:', result.error);
      throw new AppError(`Resend error: ${result.error.message}`, 502);
    }

    return res.json({ success: true, message: `Test email sent via Resend to ${recipients.join(', ')}`, id: result.data?.id });
  }

  // ── SMTP path ─────────────────────────────────────────────────────────────────
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new AppError('SMTP is not configured — fill in host, username, and password first', 400);
  }

  const port       = settings.smtpPort || 587;
  const implicitTls = port === 465;
  const requireTLS  = settings.smtpTls && !implicitTls;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port,
    secure:            implicitTls,
    requireTLS,
    connectionTimeout: 8_000,
    greetingTimeout:   8_000,
    socketTimeout:     8_000,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });

  const TIMEOUT_MS = 10_000;
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Connection timed out — server did not respond within 10 seconds')), TIMEOUT_MS)
  );

  try {
    await Promise.race([
      transporter.sendMail({
        from: `"${settings.smtpFromName || 'Mirsad'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
        to: recipients,
        subject,
        html: `<p>${message}</p>`,
      }),
      timeout,
    ]);
  } catch (err) {
    console.error('[testEmail] SMTP error:', err);
    throw new AppError(readableSmtpError(err), 502);
  }

  res.json({ success: true, message: `Test email sent via SMTP to ${recipients.join(', ')}` });
});
