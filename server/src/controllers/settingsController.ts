import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getSystemSettings, SystemSettings } from '../models/SystemSettings';
import nodemailer from 'nodemailer';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const safe = settings.toObject() as any;
  // Never expose the raw password
  if (safe.smtpPass) safe.smtpPass = '••••••••';
  res.json({ success: true, data: safe });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const { smtpPass, ...rest } = req.body;

  Object.assign(settings, rest);
  // Only overwrite password when a real value is submitted (not the masked placeholder)
  if (smtpPass && smtpPass !== '••••••••') {
    settings.smtpPass = smtpPass;
  }
  await settings.save();

  // Invalidate the cached transporter
  const { clearTransporterCache } = await import('../services/emailService');
  clearTransporterCache();

  const safe = settings.toObject() as any;
  if (safe.smtpPass) safe.smtpPass = '••••••••';
  res.json({ success: true, data: safe });
});

export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) throw new AppError('Recipient email is required', 400);

  const settings = await getSystemSettings();
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new AppError('SMTP is not configured', 400);
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpTls,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });

  await transporter.sendMail({
    from: `"${settings.smtpFromName || 'Mirsad'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
    to,
    subject: 'Mirsad – Test Email',
    html: '<p>This is a test email from your Mirsad SMTP configuration. If you received this, your settings are correct.</p>',
  });

  res.json({ success: true, message: `Test email sent to ${to}` });
});
