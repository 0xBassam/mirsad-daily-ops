import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: Number(env.SMTP_PORT || 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

const FROM = `"${env.SMTP_FROM_NAME || 'Mirsad'}" <${env.SMTP_FROM_EMAIL || env.SMTP_USER || 'noreply@mirsad.app'}>`;

async function send(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.warn('[email] send failed:', (err as Error).message);
  }
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px">${label}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${value}</td></tr>`;
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8fafc;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:#4f46e5;padding:20px 24px">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700">${title}</p>
  </div>
  <div style="padding:24px">${body}</div>
  <div style="padding:12px 24px;background:#f1f5f9;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">Mirsad Operations Platform · Automated notification</p>
  </div>
</div></body></html>`;
}

export interface RequestEmailData {
  to: string;
  requestTitle: string;
  requestType: string;
  requesterName: string;
  floor?: string;
  room?: string;
  itemCount?: number;
  requestId: string;
  appUrl?: string;
}

export async function sendRequestCreated(data: RequestEmailData) {
  const link = `${data.appUrl || env.CLIENT_URL}/client-requests/${data.requestId}`;
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">A new client request has been submitted:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Title', data.requestTitle)}
      ${row('Type', data.requestType)}
      ${row('Requested by', data.requesterName)}
      ${data.floor ? row('Floor', `${data.floor}${data.room ? ' — ' + data.room : ''}`) : ''}
      ${data.itemCount ? row('Items', String(data.itemCount)) : ''}
    </table>
    <a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">View Request</a>`;
  await send(data.to, `New Request: ${data.requestTitle}`, layout('New Client Request', body));
}

export async function sendRequestAssigned(data: RequestEmailData & { assigneeName: string }) {
  const link = `${data.appUrl || env.CLIENT_URL}/client-requests/${data.requestId}`;
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">Your request has been assigned and is being processed:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
      ${row('Assigned to', data.assigneeName)}
    </table>
    <a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">View Request</a>`;
  await send(data.to, `Request Assigned: ${data.requestTitle}`, layout('Request Assigned', body));
}

export async function sendRequestDelivered(data: RequestEmailData) {
  const link = `${data.appUrl || env.CLIENT_URL}/client-requests/${data.requestId}`;
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">Your request has been delivered. Please confirm receipt:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
    </table>
    <a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Confirm Delivery →</a>`;
  await send(data.to, `Delivered: ${data.requestTitle}`, layout('Request Delivered', body));
}

export async function sendRequestConfirmed(data: RequestEmailData) {
  const link = `${data.appUrl || env.CLIENT_URL}/client-requests/${data.requestId}`;
  const body = `
    <p style="color:#1e293b;font-size:14px;margin:0 0 16px">The client has confirmed delivery of the following request:</p>
    <table style="border-collapse:collapse;width:100%">
      ${row('Request', data.requestTitle)}
      ${row('Confirmed by', data.requesterName)}
    </table>
    <a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">View Record</a>`;
  await send(data.to, `Confirmed: ${data.requestTitle}`, layout('Delivery Confirmed', body));
}
