import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';
import { Organization, IOrganizationSettings } from '../models/Organization';
import { User } from '../models/User';

// ─── Per-org cache ────────────────────────────────────────────────────────────

const _smtpCache   = new Map<string, nodemailer.Transporter | null>();
const _resendCache = new Map<string, Resend | null>();

export function clearTransporterCache(orgId?: string) {
  if (orgId) {
    _smtpCache.delete(orgId);
    _resendCache.delete(orgId);
  } else {
    _smtpCache.clear();
    _resendCache.clear();
  }
}

// ─── Org settings loader ──────────────────────────────────────────────────────

async function loadOrgSettings(orgId: string): Promise<IOrganizationSettings> {
  try {
    const org = await Organization.findById(orgId).select('settings').lean();
    return (org?.settings as IOrganizationSettings) ?? {};
  } catch {
    return {};
  }
}

// ─── Notification recipients ──────────────────────────────────────────────────

export async function getNotificationRecipients(orgId: string): Promise<string[]> {
  try {
    const s = await loadOrgSettings(orgId);
    if (s.notificationRecipients?.length) return s.notificationRecipients;
  } catch { /* DB not ready */ }
  const users = await User.find({ organization: orgId, role: { $in: ['admin', 'project_manager'] }, status: 'active' }).select('email').lean();
  return (users as any[]).map((u: any) => u.email).filter(Boolean);
}

// ─── SMTP helpers ─────────────────────────────────────────────────────────────

function makeSmtpTransport(host: string, port: number, tls: boolean, user: string, pass: string) {
  const implicitTls = port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure:            implicitTls,
    requireTLS:        tls && !implicitTls,
    connectionTimeout: 8_000,
    greetingTimeout:   8_000,
    socketTimeout:     8_000,
    auth: { user, pass },
  });
}

function resolveSmtpTransporter(orgId: string, s: IOrganizationSettings): nodemailer.Transporter | null {
  if (_smtpCache.has(orgId)) return _smtpCache.get(orgId)!;
  let t: nodemailer.Transporter | null = null;
  if (s.smtpHost && s.smtpUser && s.smtpPass) {
    t = makeSmtpTransport(s.smtpHost, s.smtpPort || 587, !!s.smtpTls, s.smtpUser, s.smtpPass);
  } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    const port = Number(env.SMTP_PORT || 587);
    t = makeSmtpTransport(env.SMTP_HOST, port, port !== 465, env.SMTP_USER, env.SMTP_PASS);
  }
  _smtpCache.set(orgId, t);
  return t;
}

// ─── Resend helpers ───────────────────────────────────────────────────────────

function resolveResendClient(orgId: string, s: IOrganizationSettings): Resend | null {
  if (_resendCache.has(orgId)) return _resendCache.get(orgId)!;
  const key = s.resendApiKey || env.RESEND_API_KEY;
  const client = key ? new Resend(key) : null;
  _resendCache.set(orgId, client);
  return client;
}

// ─── From address resolution ──────────────────────────────────────────────────

function fromAddress(provider: 'resend' | 'smtp', s: IOrganizationSettings): string {
  if (provider === 'resend') {
    const email = s.resendFromEmail || env.RESEND_FROM_EMAIL || 'alerts@stdsec.sa';
    const name  = s.resendFromName  || env.RESEND_FROM_NAME  || 'Mirsad Alerts';
    return `${name} <${email}>`;
  }
  if (s.smtpFromEmail) return `"${s.smtpFromName || 'Mirsad'}" <${s.smtpFromEmail}>`;
  return `"${env.SMTP_FROM_NAME || 'Mirsad'}" <${env.SMTP_FROM_EMAIL || env.SMTP_USER || 'noreply@mirsad.app'}>`;
}

// ─── Alert helpers ────────────────────────────────────────────────────────────

type AlertKey = keyof NonNullable<IOrganizationSettings['emailAlerts']>;

function alertEnabled(key: AlertKey, s: IOrganizationSettings): boolean {
  return s.emailAlerts?.[key] !== false;
}

function resolvedProvider(s: IOrganizationSettings): 'resend' | 'smtp' {
  return (s.emailProvider || env.EMAIL_PROVIDER || 'smtp') as 'resend' | 'smtp';
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

function logAlert(alertKey: string, provider: string, recipients: string[], resendId?: string) {
  const masked = recipients.map(maskEmail).join(', ');
  console.log(`[alert:${alertKey}] provider=${provider} recipients=${recipients.length} [${masked}]${resendId ? ` resend_id=${resendId}` : ''}`);
}

// ─── Core send ────────────────────────────────────────────────────────────────

async function send(
  to: string | string[],
  subject: string,
  html: string,
  alertKey: string | undefined,
  orgId: string,
  orgSettings: IOrganizationSettings
) {
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  const provider = resolvedProvider(orgSettings);
  console.log('[email] send() provider:', provider, '| org:', orgId, '| to:', recipients.map(maskEmail).join(', '));

  if (provider === 'resend') {
    const client = resolveResendClient(orgId, orgSettings);
    if (!client) { console.warn('[email] Resend selected but no API key — skipping'); return; }
    const from   = fromAddress('resend', orgSettings);
    const result = await client.emails.send({ from, to: recipients, subject, html });
    if (result.error) {
      console.warn('[email] Resend error:', result.error);
    } else {
      if (alertKey) logAlert(alertKey, provider, recipients, result.data?.id);
      else console.log('[email] Resend delivered, id:', result.data?.id);
    }
    return;
  }

  const transporter = resolveSmtpTransporter(orgId, orgSettings);
  if (!transporter) return;
  const from = fromAddress('smtp', orgSettings);
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({ from, to: recipient, subject, html });
    } catch (err) {
      console.warn('[email] SMTP send failed for', maskEmail(recipient), ':', (err as Error).message);
    }
  }
  if (alertKey) logAlert(alertKey, provider, recipients);
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;white-space:nowrap">${label}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${value}</td></tr>`;
}

function layout(title: string, body: string, accentColor = '#4f46e5', footerText = 'Mirsad Operations Platform · Automated notification') {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8fafc;padding:32px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:${accentColor};padding:20px 24px">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700">${title}</p>
  </div>
  <div style="padding:24px">${body}</div>
  <div style="padding:12px 24px;background:#f1f5f9;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">${footerText}</p>
  </div>
</div></body></html>`;
}

function actionButton(label: string, href: string, color = '#4f46e5') {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">${label}</a>`;
}

function appLink(path: string) {
  return `${env.CLIENT_URL}${path}`;
}

function orgFooter(s: IOrganizationSettings): string {
  return `${s.siteName || 'Mirsad'} · Automated notification`;
}

// ─── Client Request emails ────────────────────────────────────────────────────

export interface RequestEmailData {
  to: string | string[];
  requestTitle: string;
  requestType: string;
  requesterName: string;
  floor?: string;
  room?: string;
  itemCount?: number;
  requestId: string;
  scheduledDate?: string;
  scheduledTime?: string;
  employeeName?: string;
  employeeId?: string;
  building?: string;
}

export async function sendRequestCreated(data: RequestEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('clientRequestCreated', s)) return;
  const link     = appLink(`/client-requests/${data.requestId}`);
  const location = [data.building, data.floor, data.room].filter(Boolean).join(' › ');
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A new client request has been submitted:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Title', data.requestTitle)}
      ${row('Type', data.requestType)}
      ${row('Requested by', data.requesterName)}
      ${data.scheduledDate ? row('Scheduled', `${data.scheduledDate}${data.scheduledTime ? ' at ' + data.scheduledTime : ''}`) : ''}
      ${data.employeeName ? row('Employee', `${data.employeeName}${data.employeeId ? ' (ID: ' + data.employeeId + ')' : ''}`) : ''}
      ${location ? row('Location', location) : ''}
      ${data.itemCount ? row('Items', String(data.itemCount)) : ''}
    </table>
    ${actionButton('View Request', link)}`;
  await send(data.to, `New Request: ${data.requestTitle}`, layout('New Client Request', body, s.primaryColor || '#4f46e5', orgFooter(s)), 'clientRequestCreated', orgId, s);
}

export async function sendRequestAssigned(data: RequestEmailData & { assigneeName: string }, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('clientRequestAssigned', s)) return;
  const link = appLink(`/client-requests/${data.requestId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">Your request has been assigned and is being processed:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
      ${row('Assigned to', data.assigneeName)}
    </table>
    ${actionButton('View Request', link)}`;
  await send(data.to, `Request Assigned: ${data.requestTitle}`, layout('Request Assigned', body, s.primaryColor || '#4f46e5', orgFooter(s)), 'clientRequestAssigned', orgId, s);
}

export async function sendRequestDelivered(data: RequestEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('clientRequestDelivered', s)) return;
  const link = appLink(`/client-requests/${data.requestId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">Your request has been delivered. Please confirm receipt:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
    </table>
    ${actionButton('Confirm Delivery →', link, '#059669')}`;
  await send(data.to, `Delivered: ${data.requestTitle}`, layout('Request Delivered', body, '#059669', orgFooter(s)), 'clientRequestDelivered', orgId, s);
}

export async function sendRequestConfirmed(data: RequestEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('clientRequestConfirmed', s)) return;
  const link = appLink(`/client-requests/${data.requestId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">The client has confirmed delivery:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
      ${row('Confirmed by', data.requesterName)}
    </table>
    ${actionButton('View Record', link)}`;
  await send(data.to, `Confirmed: ${data.requestTitle}`, layout('Delivery Confirmed', body, s.primaryColor || '#4f46e5', orgFooter(s)), 'clientRequestConfirmed', orgId, s);
}

// ─── Inventory alert emails ───────────────────────────────────────────────────

export interface StockAlertData {
  to: string | string[];
  itemName: string;
  itemType: string;
  remainingQty: number;
  monthlyLimit: number;
  unit: string;
  project: string;
  period: string;
}

export async function sendLowStockAlert(data: StockAlertData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('lowStock', s)) return;
  const link = appLink('/inventory/food');
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">An inventory item is running low:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Item', data.itemName)}
      ${row('Type', data.itemType)}
      ${row('Project', data.project)}
      ${row('Period', data.period)}
      ${row('Remaining', `${data.remainingQty} ${data.unit}`)}
      ${row('Monthly limit', `${data.monthlyLimit} ${data.unit}`)}
    </table>
    ${actionButton('View Inventory', link, '#d97706')}`;
  await send(data.to, `⚠ Low Stock: ${data.itemName}`, layout('Low Stock Alert', body, '#d97706', orgFooter(s)), 'lowStock', orgId, s);
}

export async function sendOutOfStockAlert(data: StockAlertData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('outOfStock', s)) return;
  const link = appLink('/inventory/food');
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">An inventory item has run out of stock:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Item', data.itemName)}
      ${row('Type', data.itemType)}
      ${row('Project', data.project)}
      ${row('Period', data.period)}
      ${row('Remaining', `${data.remainingQty} ${data.unit}`)}
    </table>
    ${actionButton('View Inventory', link, '#dc2626')}`;
  await send(data.to, `🚨 Out of Stock: ${data.itemName}`, layout('Out of Stock Alert', body, '#dc2626', orgFooter(s)), 'outOfStock', orgId, s);
}

// ─── Purchase Order emails ────────────────────────────────────────────────────

export interface POEmailData {
  to: string | string[];
  poNumber: string;
  supplierName: string;
  month: string;
  lineCount: number;
  poId: string;
}

export async function sendNewPurchaseOrder(data: POEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('newPurchaseOrder', s)) return;
  const link = appLink(`/purchase-orders/${data.poId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A new purchase order has been created:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('PO Number', data.poNumber)}
      ${row('Supplier', data.supplierName)}
      ${row('Month', data.month)}
      ${row('Line items', String(data.lineCount))}
    </table>
    ${actionButton('View Purchase Order', link)}`;
  await send(data.to, `New PO: ${data.poNumber}`, layout('New Purchase Order', body, s.primaryColor || '#4f46e5', orgFooter(s)), 'newPurchaseOrder', orgId, s);
}

// ─── Receiving emails ─────────────────────────────────────────────────────────

export interface ReceivingEmailData {
  to: string | string[];
  invoiceNumber: string;
  supplierName: string;
  lineCount: number;
  receivingId: string;
}

export async function sendReceivingCompleted(data: ReceivingEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('receivingCompleted', s)) return;
  const link = appLink(`/receiving/${data.receivingId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A receiving record has been confirmed and inventory updated:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Invoice', data.invoiceNumber || '—')}
      ${row('Supplier', data.supplierName)}
      ${row('Items received', String(data.lineCount))}
    </table>
    ${actionButton('View Receiving', link, '#0d9488')}`;
  await send(data.to, `Receiving Confirmed: ${data.invoiceNumber || data.receivingId}`, layout('Receiving Completed', body, '#0d9488', orgFooter(s)), 'receivingCompleted', orgId, s);
}

// ─── Maintenance emails ───────────────────────────────────────────────────────

export interface MaintenanceEmailData {
  to: string | string[];
  title: string;
  category: string;
  priority: string;
  location?: string;
  maintenanceId: string;
  reporterName?: string;
}

export async function sendMaintenanceOpened(data: MaintenanceEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('maintenanceOpened', s)) return;
  const link = appLink(`/maintenance/${data.maintenanceId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A new maintenance request has been submitted:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Title', data.title)}
      ${row('Category', data.category)}
      ${row('Priority', data.priority)}
      ${data.location ? row('Location', data.location) : ''}
      ${data.reporterName ? row('Reported by', data.reporterName) : ''}
    </table>
    ${actionButton('View Request', link, '#7c3aed')}`;
  await send(data.to, `Maintenance: ${data.title}`, layout('New Maintenance Request', body, '#7c3aed', orgFooter(s)), 'maintenanceOpened', orgId, s);
}

export async function sendMaintenanceCompleted(data: MaintenanceEmailData, orgId: string) {
  const s = await loadOrgSettings(orgId);
  if (!alertEnabled('maintenanceCompleted', s)) return;
  const link = appLink(`/maintenance/${data.maintenanceId}`);
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A maintenance request has been resolved:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Title', data.title)}
      ${row('Category', data.category)}
      ${row('Priority', data.priority)}
    </table>
    ${actionButton('View Record', link, '#059669')}`;
  await send(data.to, `Resolved: ${data.title}`, layout('Maintenance Resolved', body, '#059669', orgFooter(s)), 'maintenanceCompleted', orgId, s);
}
