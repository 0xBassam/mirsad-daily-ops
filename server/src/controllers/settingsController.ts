import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Organization } from '../models/Organization';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { clearTransporterCache } from '../services/emailService';

const MASK = '••••••••';

function maskSettings(obj: any): any {
  const safe = { ...obj };
  if (safe.smtpPass)     safe.smtpPass     = MASK;
  if (safe.resendApiKey) safe.resendApiKey = MASK;
  return safe;
}

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const org = await Organization.findById(orgId).select('name settings').lean();
  if (!org) throw new AppError('Organization not found', 404);
  res.json({ success: true, data: { orgName: org.name, ...maskSettings(org.settings) } });
});

const EMAIL_RE = /^[^\s@,;'"<>]+@[^\s@,;'"<>]+\.[^\s@,;'"<>]{2,}$/;

function parseAndValidateRecipientList(raw: unknown): string[] {
  if (!raw) return [];
  const list: string[] = Array.isArray(raw)
    ? raw.map(String).map(s => s.trim()).filter(Boolean)
    : String(raw).split(',').map(s => s.trim()).filter(Boolean);
  const invalid = list.filter(e => !EMAIL_RE.test(e));
  if (invalid.length > 0)
    throw new AppError(`Invalid notification recipient email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`, 400);
  return list;
}

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const org = await Organization.findById(orgId);
  if (!org) throw new AppError('Organization not found', 404);

  const body = req.body as Partial<{
    orgName: string;
    emailProvider: 'smtp' | 'resend';
    resendApiKey: string; resendFromEmail: string; resendFromName: string;
    smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string;
    smtpFromEmail: string; smtpFromName: string; smtpTls: boolean;
    notificationRecipients: string | string[];
    emailAlerts: Record<string, boolean>;
    logoUrl: string; siteName: string; department: string; primaryColor: string;
  }>;

  if (body.orgName !== undefined) org.name = body.orgName;

  const s = org.settings;
  if (body.emailProvider         !== undefined) s.emailProvider         = body.emailProvider;
  if (body.resendFromEmail       !== undefined) s.resendFromEmail       = body.resendFromEmail;
  if (body.resendFromName        !== undefined) s.resendFromName        = body.resendFromName;
  if (body.smtpHost              !== undefined) s.smtpHost              = body.smtpHost;
  if (body.smtpPort              !== undefined) s.smtpPort              = body.smtpPort;
  if (body.smtpUser              !== undefined) s.smtpUser              = body.smtpUser;
  if (body.smtpFromEmail         !== undefined) s.smtpFromEmail         = body.smtpFromEmail;
  if (body.smtpFromName          !== undefined) s.smtpFromName          = body.smtpFromName;
  if (body.smtpTls               !== undefined) s.smtpTls               = body.smtpTls;
  if (body.emailAlerts           !== undefined) s.emailAlerts           = body.emailAlerts as any;
  if (body.notificationRecipients !== undefined)
    s.notificationRecipients = parseAndValidateRecipientList(body.notificationRecipients);
  if (body.logoUrl      !== undefined) s.logoUrl      = body.logoUrl;
  if (body.siteName     !== undefined) s.siteName     = body.siteName;
  if (body.department   !== undefined) s.department   = body.department;
  if (body.primaryColor !== undefined) s.primaryColor = body.primaryColor;
  // Only overwrite secrets when a real value is submitted (not the mask)
  if (body.smtpPass     && body.smtpPass     !== MASK) s.smtpPass     = body.smtpPass;
  if (body.resendApiKey && body.resendApiKey !== MASK) s.resendApiKey = body.resendApiKey;

  org.markModified('settings');
  await org.save();
  clearTransporterCache(orgId);

  const saved = org.toObject();
  res.json({ success: true, data: { orgName: saved.name, ...maskSettings(saved.settings) } });
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

function parseAndValidateRecipients(raw: unknown): string[] {
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

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const org = await Organization.findById(orgId)
    .select('name plan status trialEndsAt planExpiresAt maxUsers maxProjects storageLimitMb featureFlags suspendedAt')
    .lean();
  if (!org) throw new AppError('Organization not found', 404);

  const flags = org.featureFlags as Record<string, boolean>;
  res.json({
    success: true,
    data: {
      plan:           org.plan,
      status:         org.status,
      trialEndsAt:    org.trialEndsAt,
      planExpiresAt:  org.planExpiresAt,
      maxUsers:       org.maxUsers,
      maxProjects:    org.maxProjects,
      storageLimitMb: org.storageLimitMb,
      featureFlags:   flags,
      suspendedAt:    org.suspendedAt,
    },
  });
});

export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const orgId      = req.organizationId as string;
  const recipients = parseAndValidateRecipients(req.body.to);
  const { subject, message } = validateTestEmailBody(req.body);

  const org = await Organization.findById(orgId).select('settings').lean();
  const s   = (org?.settings as any) ?? {};

  const provider = s.emailProvider || env.EMAIL_PROVIDER || 'smtp';

  // ── Resend path ───────────────────────────────────────────────────────────────
  if (provider === 'resend') {
    const apiKey = s.resendApiKey || env.RESEND_API_KEY;
    if (!apiKey) throw new AppError('Resend API key is not configured', 400);

    const fromEmail = s.resendFromEmail || env.RESEND_FROM_EMAIL || 'alerts@stdsec.sa';
    const fromName  = s.resendFromName  || env.RESEND_FROM_NAME  || 'Mirsad Alerts';
    const from      = `${fromName} <${fromEmail}>`;

    const client = new Resend(apiKey);
    const result = await client.emails.send({ from, to: recipients, subject, html: `<p>${message}</p>` });
    if (result.error) throw new AppError(`Resend error: ${result.error.message}`, 502);
    return res.json({ success: true, message: `Test email sent via Resend to ${recipients.join(', ')}`, id: result.data?.id });
  }

  // ── SMTP path ─────────────────────────────────────────────────────────────────
  if (!s.smtpHost || !s.smtpUser || !s.smtpPass) {
    throw new AppError('SMTP is not configured — fill in host, username, and password first', 400);
  }

  const port        = s.smtpPort || 587;
  const implicitTls = port === 465;
  const requireTLS  = s.smtpTls && !implicitTls;

  const transporter = nodemailer.createTransport({
    host: s.smtpHost,
    port,
    secure:            implicitTls,
    requireTLS,
    connectionTimeout: 8_000,
    greetingTimeout:   8_000,
    socketTimeout:     8_000,
    auth: { user: s.smtpUser, pass: s.smtpPass },
  });

  const TIMEOUT_MS = 10_000;
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Connection timed out — server did not respond within 10 seconds')), TIMEOUT_MS)
  );

  try {
    await Promise.race([
      transporter.sendMail({
        from: `"${s.smtpFromName || 'Mirsad'}" <${s.smtpFromEmail || s.smtpUser}>`,
        to: recipients,
        subject,
        html: `<p>${message}</p>`,
      }),
      timeout,
    ]);
  } catch (err) {
    throw new AppError(readableSmtpError(err), 502);
  }

  res.json({ success: true, message: `Test email sent via SMTP to ${recipients.join(', ')}` });
});
