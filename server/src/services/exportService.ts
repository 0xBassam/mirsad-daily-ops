/**
 * Mirsad Export Service
 * PDF (pdfkit) + Excel (exceljs) exporters for all operational data types.
 * Arabic text rendered via embedded Noto Naskh Arabic font.
 */
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { format } from 'date-fns';
import { ClientRequest } from '../models/ClientRequest';
import { Receiving } from '../models/Receiving';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { InventoryBalance } from '../models/InventoryBalance';
import { AuditLog } from '../models/AuditLog';
import { FloorCheck } from '../models/FloorCheck';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { StockMovement } from '../models/StockMovement';
import { ApprovalRecord } from '../models/ApprovalRecord';
import { Transfer } from '../models/Transfer';
import { DailyPlan } from '../models/DailyPlan';
import { Organization } from '../models/Organization';

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONTS_DIR   = path.resolve(__dirname, '../assets/fonts');
const AR_REGULAR  = path.join(FONTS_DIR, 'NotoNaskhArabic-Regular.ttf');
const AR_BOLD     = path.join(FONTS_DIR, 'NotoNaskhArabic-Bold.ttf');
const HAS_ARABIC  = /[؀-ۿ]/;
const hasAr = (t: string) => HAS_ARABIC.test(String(t ?? ''));

// ── PDF Layout Constants ───────────────────────────────────────────────────────
const PW         = 595.28;   // A4 width  (pt)
const PH         = 841.89;   // A4 height (pt)
const M          = 40;       // margin
const HDR_H      = 68;       // header block height
const FTR_H      = 30;       // footer block height
const META_H     = 32;       // metadata row height
const TBL_START  = M + HDR_H + META_H + 14;  // y where table starts
const BODY_BTMY  = PH - FTR_H - 8;           // max y for body content

// Status colours for PDF cell text
const SC: Record<string, string> = {
  submitted: '#3B82F6', assigned: '#6366F1', in_progress: '#D97706',
  delivered: '#059669', confirmed: '#059669', rejected: '#DC2626',
  pending: '#64748B', partial: '#D97706',
  active: '#3B82F6', partially_received: '#D97706', fully_received: '#059669',
  near_depletion: '#EA580C', over_consumed: '#DC2626', closed: '#64748B',
  resolved: '#059669', low_stock: '#D97706', out_of_stock: '#DC2626',
  available: '#059669', open: '#DC2626', ok: '#059669',
};
const statusColor = (s: string) => SC[String(s)] ?? '#475569';

// ── PDF Builder ───────────────────────────────────────────────────────────────

function createDoc(): InstanceType<typeof PDFDocument> {
  const doc = new (PDFDocument as any)({ margin: M, size: 'A4', bufferPages: true });
  if (fs.existsSync(AR_REGULAR)) doc.registerFont('NotoAR',  AR_REGULAR);
  if (fs.existsSync(AR_BOLD))    doc.registerFont('NotoARB', AR_BOLD);
  return doc;
}

function fontFor(doc: any, text: string, bold = false) {
  if (hasAr(text)) {
    doc.font(bold ? (fs.existsSync(AR_BOLD) ? 'NotoARB' : 'Helvetica-Bold') : (fs.existsSync(AR_REGULAR) ? 'NotoAR' : 'Helvetica'));
  } else {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
  }
}

function drawHdr(doc: any, title: string, subtitle?: string, orgName?: string, orgDept?: string) {
  // Logo block
  doc.roundedRect(M, M, 38, 38, 7).fill('#4F46E5');
  doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(20)
    .text((orgName || 'Mirsad').charAt(0).toUpperCase(), M, M + 8, { width: 38, align: 'center', lineBreak: false });

  // Title block
  doc.font('Helvetica-Bold').fontSize(13).fill('#0F172A')
    .text(orgName || 'Mirsad', M + 50, M + 2, { lineBreak: false });
  doc.font('Helvetica').fontSize(8).fill('#64748B')
    .text(orgDept || '', M + 50, M + 18, { lineBreak: false });

  if (subtitle) {
    fontFor(doc, subtitle);
    doc.fontSize(8).fill('#64748B').text(subtitle, M + 50, M + 30, { lineBreak: false });
  }

  // Report title right-aligned
  doc.font('Helvetica-Bold').fontSize(11).fill('#1E293B')
    .text(title, M, M + 48, { width: PW - M * 2, align: 'right', lineBreak: false });

  // Divider
  doc.moveTo(M, M + 64).lineTo(PW - M, M + 64).strokeColor('#E2E8F0').lineWidth(1).stroke();
}

interface MetaEntry { label: string; value: string }

function drawMeta(doc: any, entries: MetaEntry[]) {
  const y = M + HDR_H + 2;
  const colW = (PW - M * 2) / Math.min(entries.length, 4);
  entries.slice(0, 4).forEach(({ label, value }, i) => {
    const x = M + i * colW;
    doc.font('Helvetica').fontSize(7).fill('#94A3B8').text(label, x, y, { width: colW - 4, lineBreak: false });
    fontFor(doc, value, true);
    doc.fontSize(8).fill('#1E293B').text(value || '—', x, y + 11, { width: colW - 4, lineBreak: false });
  });
}

interface PDFCol { header: string; key: string; width: number; align?: string; status?: boolean; numeric?: boolean }

function drawTblHdr(doc: any, cols: PDFCol[], y: number): number {
  const H = 18;
  doc.rect(M, y, PW - M * 2, H).fill('#4F46E5');
  let x = M;
  cols.forEach(c => {
    doc.font('Helvetica-Bold').fontSize(7.5).fill('#FFFFFF')
      .text(c.header, x + 3, y + 5, { width: c.width - 6, align: (c.align as any) || 'left', lineBreak: false });
    x += c.width;
  });
  return y + H;
}

function drawTblRow(doc: any, cols: PDFCol[], row: Record<string, any>, y: number, even: boolean): number {
  const H = 16;
  if (even) doc.rect(M, y, PW - M * 2, H).fill('#F8FAFC');
  let x = M;
  cols.forEach(c => {
    const raw = row[c.key];
    const str = String(raw ?? '—');
    if (c.status) {
      doc.font('Helvetica-Bold').fontSize(7).fill(statusColor(str))
        .text(str.replace(/_/g, ' '), x + 3, y + 4, { width: c.width - 6, lineBreak: false });
    } else {
      fontFor(doc, str);
      doc.fontSize(7.5).fill('#334155')
        .text(str, x + 3, y + 4, { width: c.width - 6, align: (c.align as any) || 'left', lineBreak: false });
    }
    x += c.width;
  });
  doc.moveTo(M, y + H).lineTo(PW - M, y + H).strokeColor('#F1F5F9').lineWidth(0.3).stroke();
  return y + H;
}

function drawFtr(doc: any, pageNum: number, total: number, orgName?: string) {
  const y = PH - FTR_H;
  doc.moveTo(M, y).lineTo(PW - M, y).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(7).fill('#94A3B8')
    .text(`Confidential — ${orgName || 'Mirsad'}`, M, y + 8, { width: 260, lineBreak: false });
  doc.font('Helvetica').fontSize(7).fill('#94A3B8')
    .text(`Page ${pageNum} of ${total}  ·  Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      PW / 2, y + 8, { width: PW / 2 - M, align: 'right', lineBreak: false });
}

async function buildPDF(
  res: Response,
  filename: string,
  title: string,
  subtitle: string | undefined,
  meta: MetaEntry[],
  cols: PDFCol[],
  rows: Record<string, any>[],
  orgId?: string
): Promise<void> {
  let orgName: string | undefined;
  let orgDept: string | undefined;
  if (orgId) {
    try {
      const org = await Organization.findById(orgId).select('name settings.department').lean() as any;
      orgName = org?.name;
      orgDept = org?.settings?.department;
    } catch { /* use defaults */ }
  }

  const doc = createDoc();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let y = TBL_START;
  drawHdr(doc, title, subtitle, orgName, orgDept);
  drawMeta(doc, meta);

  // Table
  doc.moveTo(M, y - 4).lineTo(PW - M, y - 4).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  y = drawTblHdr(doc, cols, y);

  rows.forEach((row, i) => {
    if (y + 16 > BODY_BTMY) {
      doc.addPage();
      y = M + 10;
      drawHdr(doc, title, undefined, orgName, orgDept);
      y = drawTblHdr(doc, cols, y + HDR_H + 10);
    }
    y = drawTblRow(doc, cols, row, y, i % 2 === 0);
  });

  if (!rows.length) {
    doc.font('Helvetica').fontSize(9).fill('#94A3B8')
      .text('No data available for this report.', M, y + 10, { align: 'center', width: PW - M * 2 });
  }

  // Footers on all pages
  const range = (doc as any).bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    (doc as any).switchToPage(range.start + p);
    drawFtr(doc, p + 1, range.count, orgName);
  }

  doc.end();
}

// ── Excel Builder ─────────────────────────────────────────────────────────────

interface XLCol { header: string; key: string; width: number; numFmt?: string; status?: boolean }

const XL_STATUS_FILLS: Record<string, string> = {
  submitted: 'FFDBEAFE', assigned: 'FFE0E7FF', in_progress: 'FFFEF3C7',
  delivered: 'FFD1FAE5', confirmed: 'FFD1FAE5', rejected: 'FFFEE2E2',
  pending: 'FFF1F5F9', partial: 'FFFEF3C7',
  active: 'FFDBEAFE', partially_received: 'FFFEF3C7', fully_received: 'FFD1FAE5',
  near_depletion: 'FFFFF7ED', over_consumed: 'FFFEE2E2', closed: 'FFF1F5F9',
  low_stock: 'FFFEF3C7', out_of_stock: 'FFFEE2E2', available: 'FFD1FAE5',
  ok: 'FFD1FAE5', open: 'FFFEE2E2', resolved: 'FFD1FAE5',
};

async function buildExcel(
  res: Response,
  filename: string,
  sheetTitle: string,
  reportTitle: string,
  meta: MetaEntry[],
  cols: XLCol[],
  rows: Record<string, any>[],
  orgId?: string
): Promise<void> {
  let orgName = 'Mirsad';
  let orgDept = '';
  if (orgId) {
    try {
      const org = await Organization.findById(orgId).select('name settings.department').lean() as any;
      if (org?.name) orgName = org.name;
      orgDept = org?.settings?.department || '';
    } catch { /* use defaults */ }
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = orgName;
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetTitle, { pageSetup: { orientation: 'landscape', fitToPage: true } });
  ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

  // Row 1: Company header (merged)
  const numCols = cols.length;
  ws.mergeCells(1, 1, 1, numCols);
  const hdrCell = ws.getCell(1, 1);
  hdrCell.value = orgDept ? `${orgName.toUpperCase()} — ${orgDept}` : orgName.toUpperCase();
  hdrCell.font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  hdrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  hdrCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Row 2: Report title
  ws.mergeCells(2, 1, 2, numCols);
  const titleCell = ws.getCell(2, 1);
  titleCell.value = reportTitle;
  titleCell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF1E293B' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // Row 3: Meta info
  ws.mergeCells(3, 1, 3, numCols);
  const metaStr = meta.map(e => `${e.label}: ${e.value}`).join('   |   ');
  const metaCell = ws.getCell(3, 1);
  metaCell.value = metaStr;
  metaCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' }, italic: true };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 16;

  // Row 4: spacer
  ws.getRow(4).height = 6;

  // Row 5: Column headers
  const hdrRow = ws.getRow(5);
  cols.forEach((c, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF6366F1' } } };
  });
  hdrRow.height = 20;
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: numCols } };
  ws.views = [{ state: 'frozen', ySplit: 5 }];

  // Data rows
  rows.forEach((row, i) => {
    const dataRow = ws.addRow(cols.map(c => row[c.key] ?? ''));
    dataRow.height = 16;
    const isEven = i % 2 === 0;
    cols.forEach((c, j) => {
      const cell = dataRow.getCell(j + 1);
      cell.font = { name: 'Calibri', size: 9.5 };
      cell.alignment = { vertical: 'middle', wrapText: false };

      if (c.numFmt) cell.numFmt = c.numFmt;

      if (c.status) {
        const val = String(row[c.key] ?? '').toLowerCase();
        const fillArgb = XL_STATUS_FILLS[val] || (isEven ? 'FFF8FAFC' : 'FFFFFFFF');
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.font = { name: 'Calibri', size: 9, bold: true };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
      }

      // Light border
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
    });
  });

  if (!rows.length) {
    const emptyRow = ws.addRow(['No data available for this report.']);
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };
    ws.mergeCells(6, 1, 6, numCols);
  }

  // Summary row
  ws.addRow([]);
  const footerRow = ws.addRow([`Total rows: ${rows.length}   ·   Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}   ·   ${orgName}`]);
  ws.mergeCells(footerRow.number, 1, footerRow.number, numCols);
  footerRow.getCell(1).font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
}

// ── Filename helper ────────────────────────────────────────────────────────────
const dateStr = () => format(new Date(), 'yyyy-MM-dd');
const safeName = (label: string) => `Mirsad_${label}_${dateStr()}`;

// ── Operation Requests ─────────────────────────────────────────────────────────
const OP_COLS_PDF: PDFCol[] = [
  { header: 'Request Title', key: 'title',    width: 155 },
  { header: 'Floor',         key: 'floor',    width: 55 },
  { header: 'Items',         key: 'itemCount',width: 40, align: 'center' },
  { header: 'Priority',      key: 'priority', width: 52 },
  { header: 'Status',        key: 'status',   width: 70, status: true },
  { header: 'Requested',     key: 'createdAt',width: 65 },
  { header: 'Expected',      key: 'expected', width: 58 },
];
const OP_COLS_XL: XLCol[] = [
  { header: 'Request Title',  key: 'title',    width: 38 },
  { header: 'Floor',          key: 'floor',    width: 12 },
  { header: 'Items',          key: 'itemCount',width: 10 },
  { header: 'Priority',       key: 'priority', width: 12 },
  { header: 'Status',         key: 'status',   width: 18, status: true },
  { header: 'Requested At',   key: 'createdAt',width: 18 },
  { header: 'Expected',       key: 'expected', width: 18 },
  { header: 'Delivered At',   key: 'delivered',width: 18 },
  { header: 'Notes',          key: 'notes',    width: 28 },
];

async function fetchRequestRows(type: string, dateFrom?: Date, dateTo?: Date, organizationId?: string) {
  const filter: any = { requestType: type };
  if (organizationId) filter.organization = organizationId;
  if (dateFrom || dateTo) filter.createdAt = {};
  if (dateFrom) filter.createdAt.$gte = dateFrom;
  if (dateTo)   filter.createdAt.$lte = dateTo;

  const reqs = await ClientRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('floor', 'name')
    .populate('requestedBy', 'fullName')
    .lean();

  return reqs.map((r: any) => ({
    title:     r.title,
    floor:     r.floor?.name || '—',
    itemCount: r.items?.length ?? 0,
    priority:  r.priority,
    status:    r.status,
    createdAt: format(new Date(r.createdAt), 'dd/MM/yyyy'),
    expected:  r.expectedDelivery ? format(new Date(r.expectedDelivery), 'dd/MM/yyyy') : '—',
    delivered: r.deliveredAt ? format(new Date(r.deliveredAt), 'dd/MM/yyyy') : '—',
    notes:     r.notes || '',
    requestedBy: (r.requestedBy as any)?.fullName || '—',
  }));
}

export async function exportOperationRequestsPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const rows = await fetchRequestRows('operation_request', opts.dateFrom, opts.dateTo, opts.organizationId);
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Operation Requests' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom, 'dd/MM/yyyy')} – ${format(opts.dateTo || new Date(), 'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Operation_Requests')}.pdf`, 'Operation Requests Report', undefined, meta, OP_COLS_PDF, rows, opts.organizationId);
}

export async function exportOperationRequestsExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const rows = await fetchRequestRows('operation_request', opts.dateFrom, opts.dateTo, opts.organizationId);
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom, 'dd MMM yyyy')} – ${format(opts.dateTo || new Date(), 'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Operation_Requests')}.xlsx`, 'Operation Requests', 'Operation Requests Report', meta, OP_COLS_XL, rows, opts.organizationId);
}

// ── Coffee Break Requests ──────────────────────────────────────────────────────
export async function exportCoffeeBreakRequestsPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const rows = await fetchRequestRows('coffee_break_request', opts.dateFrom, opts.dateTo, opts.organizationId);
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Coffee Break Requests' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom, 'dd/MM/yyyy')} – ${format(opts.dateTo || new Date(), 'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  const cols: PDFCol[] = OP_COLS_PDF.map(c => c.key === 'title' ? { ...c, header: 'Request / Event' } : c);
  await buildPDF(res, `${safeName('Coffee_Break_Requests')}.pdf`, 'Coffee Break Requests Report', undefined, meta, cols, rows, opts.organizationId);
}

export async function exportCoffeeBreakRequestsExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const rows = await fetchRequestRows('coffee_break_request', opts.dateFrom, opts.dateTo, opts.organizationId);
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom, 'dd MMM yyyy')} – ${format(opts.dateTo || new Date(), 'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Coffee_Break_Requests')}.xlsx`, 'Coffee Break Requests', 'Coffee Break Requests Report', meta, OP_COLS_XL, rows, opts.organizationId);
}

// ── Receiving Records ─────────────────────────────────────────────────────────
const REC_COLS_PDF: PDFCol[] = [
  { header: 'Invoice #',      key: 'invoice',   width: 80 },
  { header: 'Supplier',       key: 'supplier',  width: 130 },
  { header: 'Delivery Date',  key: 'date',      width: 75 },
  { header: 'Items',          key: 'lineCount', width: 45, align: 'center' },
  { header: 'Status',         key: 'status',    width: 70, status: true },
  { header: 'Notes',          key: 'notes',     width: 115 },
];
const REC_COLS_XL: XLCol[] = [
  { header: 'Invoice #',     key: 'invoice',   width: 18 },
  { header: 'Supplier',      key: 'supplier',  width: 30 },
  { header: 'Delivery Date', key: 'date',      width: 16 },
  { header: 'PO Number',     key: 'poNumber',  width: 20 },
  { header: 'Items',         key: 'lineCount', width: 10 },
  { header: 'Total Ordered', key: 'totalOrdered', width: 14 },
  { header: 'Total Received',key: 'totalReceived', width: 14 },
  { header: 'Status',        key: 'status',    width: 18, status: true },
  { header: 'Received By',   key: 'receivedBy',width: 20 },
  { header: 'Notes',         key: 'notes',     width: 30 },
];

export async function exportReceivingPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.deliveryDate = {}; if (opts.dateFrom) filter.deliveryDate.$gte = opts.dateFrom; if (opts.dateTo) filter.deliveryDate.$lte = opts.dateTo; }
  const recs = await Receiving.find(filter).sort({ deliveryDate: -1 }).populate('supplier', 'name').populate('receivedBy', 'fullName').lean();
  const rows = recs.map((r: any) => ({
    invoice:  r.invoiceNumber || '—',
    supplier: (r.supplier as any)?.name || '—',
    date:     format(new Date(r.deliveryDate), 'dd/MM/yyyy'),
    lineCount: String(r.lines?.length ?? 0),
    status:   r.status,
    notes:    r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Receiving Records' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom,'dd/MM/yyyy')} – ${format(opts.dateTo||new Date(),'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Receiving_Records')}.pdf`, 'Receiving Records Report', undefined, meta, REC_COLS_PDF, rows, opts.organizationId);
}

export async function exportReceivingExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.deliveryDate = {}; if (opts.dateFrom) filter.deliveryDate.$gte = opts.dateFrom; if (opts.dateTo) filter.deliveryDate.$lte = opts.dateTo; }
  const recs = await Receiving.find(filter).sort({ deliveryDate: -1 })
    .populate('supplier', 'name').populate('receivedBy', 'fullName')
    .populate({ path: 'purchaseOrder', select: 'poNumber' }).lean();
  const rows = recs.map((r: any) => ({
    invoice:       r.invoiceNumber || '—',
    supplier:      (r.supplier as any)?.name || '—',
    date:          format(new Date(r.deliveryDate), 'dd/MM/yyyy'),
    poNumber:      (r.purchaseOrder as any)?.poNumber || '—',
    lineCount:     r.lines?.length ?? 0,
    totalOrdered:  r.lines?.reduce((s: number, l: any) => s + (l.quantityOrdered || 0), 0) ?? 0,
    totalReceived: r.lines?.reduce((s: number, l: any) => s + (l.quantityReceived || 0), 0) ?? 0,
    status:        r.status,
    receivedBy:    (r.receivedBy as any)?.fullName || '—',
    notes:         r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom,'dd MMM yyyy')} – ${format(opts.dateTo||new Date(),'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Receiving_Records')}.xlsx`, 'Receiving Records', 'Receiving Records Report', meta, REC_COLS_XL, rows, opts.organizationId);
}

// ── Purchase Orders ────────────────────────────────────────────────────────────
const PO_COLS_PDF: PDFCol[] = [
  { header: 'PO Number',   key: 'poNumber',  width: 110 },
  { header: 'Supplier',    key: 'supplier',  width: 130 },
  { header: 'Month',       key: 'month',     width: 55 },
  { header: 'Lines',       key: 'lineCount', width: 40, align: 'center' },
  { header: 'Received %',  key: 'receivedPct', width: 55, align: 'center' },
  { header: 'Status',      key: 'status',    width: 70, status: true },
  { header: 'Created',     key: 'createdAt', width: 55 },
];
const PO_COLS_XL: XLCol[] = [
  { header: 'PO Number',      key: 'poNumber',    width: 22 },
  { header: 'Supplier',       key: 'supplier',    width: 32 },
  { header: 'Month',          key: 'month',       width: 12 },
  { header: 'Line Items',     key: 'lineCount',   width: 12 },
  { header: 'Total Approved', key: 'totalApproved', width: 16 },
  { header: 'Total Received', key: 'totalReceived', width: 16 },
  { header: 'Received %',     key: 'receivedPct', width: 14, numFmt: '0"%"' },
  { header: 'Status',         key: 'status',      width: 20, status: true },
  { header: 'Created Date',   key: 'createdAt',   width: 18 },
  { header: 'Notes',          key: 'notes',       width: 30 },
];

export async function exportPurchaseOrdersPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.createdAt = {}; if (opts.dateFrom) filter.createdAt.$gte = opts.dateFrom; if (opts.dateTo) filter.createdAt.$lte = opts.dateTo; }
  const pos = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).populate('supplier', 'name').lean();
  const rows = pos.map((p: any) => {
    const totalA = p.lines?.reduce((s: number, l: any) => s + (l.approvedQty || 0), 0) ?? 0;
    const totalR = p.lines?.reduce((s: number, l: any) => s + (l.receivedQty || 0), 0) ?? 0;
    return {
      poNumber:   p.poNumber,
      supplier:   (p.supplier as any)?.name || '—',
      month:      p.month,
      lineCount:  String(p.lines?.length ?? 0),
      receivedPct: `${totalA > 0 ? Math.round(totalR/totalA*100) : 0}%`,
      status:     p.status,
      createdAt:  format(new Date(p.createdAt), 'dd/MM/yyyy'),
    };
  });
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Purchase Orders' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom,'dd/MM/yyyy')} – ${format(opts.dateTo||new Date(),'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Purchase_Orders')}.pdf`, 'Purchase Orders Report', undefined, meta, PO_COLS_PDF, rows, opts.organizationId);
}

export async function exportPurchaseOrdersExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.createdAt = {}; if (opts.dateFrom) filter.createdAt.$gte = opts.dateFrom; if (opts.dateTo) filter.createdAt.$lte = opts.dateTo; }
  const pos = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).populate('supplier', 'name').lean();
  const rows = pos.map((p: any) => {
    const totalA = p.lines?.reduce((s: number, l: any) => s + (l.approvedQty || 0), 0) ?? 0;
    const totalR = p.lines?.reduce((s: number, l: any) => s + (l.receivedQty || 0), 0) ?? 0;
    return {
      poNumber:      p.poNumber,
      supplier:      (p.supplier as any)?.name || '—',
      month:         p.month,
      lineCount:     p.lines?.length ?? 0,
      totalApproved: totalA,
      totalReceived: totalR,
      receivedPct:   totalA > 0 ? Math.round(totalR/totalA*100) : 0,
      status:        p.status,
      createdAt:     format(new Date(p.createdAt), 'dd/MM/yyyy'),
      notes:         p.notes || '',
    };
  });
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom,'dd MMM yyyy')} – ${format(opts.dateTo||new Date(),'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Purchase_Orders')}.xlsx`, 'Purchase Orders', 'Purchase Orders Report', meta, PO_COLS_XL, rows, opts.organizationId);
}

// ── Low Stock / Inventory ──────────────────────────────────────────────────────
const LS_COLS_PDF: PDFCol[] = [
  { header: 'Item Name',    key: 'itemName',   width: 160 },
  { header: 'Category',     key: 'category',   width: 90 },
  { header: 'Type',         key: 'type',       width: 55 },
  { header: 'Unit',         key: 'unit',       width: 40 },
  { header: 'Remaining',    key: 'remaining',  width: 55, align: 'center' },
  { header: 'Monthly Limit',key: 'limit',      width: 60, align: 'center' },
  { header: 'Status',       key: 'status',     width: 55, status: true },
];
const INV_COLS_XL: XLCol[] = [
  { header: 'Item Name',      key: 'itemName',    width: 32 },
  { header: 'Category',       key: 'category',    width: 22 },
  { header: 'Type',           key: 'type',        width: 12 },
  { header: 'Unit',           key: 'unit',        width: 10 },
  { header: 'Monthly Limit',  key: 'limit',       width: 14 },
  { header: 'Opening',        key: 'opening',     width: 12 },
  { header: 'Received',       key: 'received',    width: 12 },
  { header: 'Consumed',       key: 'consumed',    width: 12 },
  { header: 'Issued',         key: 'issued',      width: 12 },
  { header: 'Damaged',        key: 'damaged',     width: 12 },
  { header: 'Remaining',      key: 'remaining',   width: 12 },
  { header: 'Status',         key: 'status',      width: 18, status: true },
];

export async function exportLowStockPDF(res: Response, opts: { period?: string; organizationId?: string } = {}) {
  const period = opts.period || format(new Date(), 'yyyy-MM');
  const orgFilter = opts.organizationId ? { organization: opts.organizationId } : {};
  const balances = await InventoryBalance.find({ ...orgFilter, period, status: { $in: ['low_stock', 'out_of_stock'] } })
    .populate({ path: 'item', populate: { path: 'category', select: 'name' } }).lean();
  const rows = balances.filter((b: any) => b.item).sort((a: any, b: any) => a.remainingQty - b.remainingQty).map((b: any) => ({
    itemName:  b.item?.name || '—',
    category:  b.item?.category?.name || '—',
    type:      b.item?.type || '—',
    unit:      b.item?.unit || '—',
    remaining: String(b.remainingQty),
    limit:     String(b.monthlyLimit),
    status:    b.status,
  }));
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Low Stock & Out of Stock Items' },
    { label: 'Period',    value: period },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Low_Stock_Items')}.pdf`, 'Low Stock Items Report', undefined, meta, LS_COLS_PDF, rows, opts.organizationId);
}

export async function exportLowStockExcel(res: Response, opts: { period?: string; type?: 'food' | 'material' | 'all'; organizationId?: string } = {}) {
  const period = opts.period || format(new Date(), 'yyyy-MM');
  const statusFilter = opts.type === 'all' ? {} : { status: { $in: ['low_stock', 'out_of_stock'] } };
  const orgFilter = opts.organizationId ? { organization: opts.organizationId } : {};

  const balances = await InventoryBalance.find({ ...orgFilter, period, ...statusFilter })
    .populate({ path: 'item', populate: { path: 'category', select: 'name' } }).lean();

  const rows = balances.filter((b: any) => b.item && (opts.type === 'all' || opts.type === undefined || b.item.type === opts.type)).map((b: any) => ({
    itemName:  b.item?.name || '—',
    category:  b.item?.category?.name || '—',
    type:      b.item?.type || '—',
    unit:      b.item?.unit || '—',
    limit:     b.monthlyLimit,
    opening:   b.openingBalance,
    received:  b.receivedQty,
    consumed:  b.consumedQty,
    issued:    b.issuedQty,
    damaged:   b.damagedQty,
    remaining: b.remainingQty,
    status:    b.status,
  }));

  const meta: MetaEntry[] = [
    { label: 'Period', value: period },
    { label: 'Type',   value: opts.type || 'All' },
    { label: 'Records',value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Inventory_Report')}.xlsx`, 'Inventory', `Inventory Report — ${period}`, meta, INV_COLS_XL, rows, opts.organizationId);
}

// ── Audit Logs ─────────────────────────────────────────────────────────────────
const AUDIT_COLS_PDF: PDFCol[] = [
  { header: 'Date / Time',  key: 'date',       width: 85 },
  { header: 'User',         key: 'user',       width: 110 },
  { header: 'Action',       key: 'action',     width: 65 },
  { header: 'Entity Type',  key: 'entity',     width: 105 },
  { header: 'IP Address',   key: 'ip',         width: 75 },
  { header: 'Status',       key: 'outcome',    width: 75, status: true },
];
const AUDIT_COLS_XL: XLCol[] = [
  { header: 'Date / Time',  key: 'date',       width: 20 },
  { header: 'User',         key: 'user',       width: 28 },
  { header: 'Role',         key: 'role',       width: 20 },
  { header: 'Action',       key: 'action',     width: 16 },
  { header: 'Entity Type',  key: 'entity',     width: 22 },
  { header: 'Entity ID',    key: 'entityId',   width: 28 },
  { header: 'IP Address',   key: 'ip',         width: 16 },
  { header: 'User Agent',   key: 'ua',         width: 32 },
];

export async function exportAuditLogsPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.createdAt = {}; if (opts.dateFrom) filter.createdAt.$gte = opts.dateFrom; if (opts.dateTo) filter.createdAt.$lte = opts.dateTo; }
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(500).populate('user', 'fullName role').lean();
  const rows = logs.map((l: any) => ({
    date:    format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm'),
    user:    (l.user as any)?.fullName || 'System',
    action:  l.action,
    entity:  l.entityType?.replace(/_/g, ' ') || '—',
    ip:      l.ipAddress || '—',
    outcome: 'ok',
  }));
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Audit Logs' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom,'dd/MM/yyyy')} – ${format(opts.dateTo||new Date(),'dd/MM/yyyy')}` : 'Last 500 entries' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Audit_Logs')}.pdf`, 'Audit Log Report', undefined, meta, AUDIT_COLS_PDF, rows, opts.organizationId);
}

export async function exportAuditLogsExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.createdAt = {}; if (opts.dateFrom) filter.createdAt.$gte = opts.dateFrom; if (opts.dateTo) filter.createdAt.$lte = opts.dateTo; }
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(2000).populate('user', 'fullName role').lean();
  const rows = logs.map((l: any) => ({
    date:     format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm'),
    user:     (l.user as any)?.fullName || 'System',
    role:     (l.user as any)?.role || '—',
    action:   l.action,
    entity:   l.entityType?.replace(/_/g, ' ') || '—',
    entityId: l.entityId?.toString() || '—',
    ip:       l.ipAddress || '—',
    ua:       l.userAgent ? l.userAgent.slice(0, 50) : '—',
  }));
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom,'dd MMM yyyy')} – ${format(opts.dateTo||new Date(),'dd MMM yyyy')}` : 'Last 2000 entries' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Audit_Logs')}.xlsx`, 'Audit Logs', 'Audit Log Report', meta, AUDIT_COLS_XL, rows, opts.organizationId);
}

// ── Saved Report generic PDF/Excel ─────────────────────────────────────────────
export async function exportSavedReportPDF(reportId: string, res: Response, organizationId?: string): Promise<void> {
  // Delegate to domain-specific exporters based on reportType
  const { Report } = await import('../models/Report');
  const reportFilter: any = { _id: reportId };
  if (organizationId) reportFilter.organization = organizationId;
  const report = await Report.findOne(reportFilter).lean();
  if (!report) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

  const df = report.dateFrom ? new Date(report.dateFrom as any) : undefined;
  const dt = report.dateTo   ? new Date(report.dateTo as any)   : undefined;

  switch ((report as any).reportType) {
    case 'monthly_food_inventory':
      return exportLowStockExcel(res, { period: df ? format(df, 'yyyy-MM') : undefined, type: 'food', organizationId });
    case 'monthly_materials':
      return exportLowStockExcel(res, { period: df ? format(df, 'yyyy-MM') : undefined, type: 'material', organizationId });
    case 'approval_summary':
      return exportAuditLogsPDF(res, { dateFrom: df, dateTo: dt, organizationId });
    default:
      // Generic: pull report data and render
      return exportGenericReportPDF(report as any, res, organizationId);
  }
}

async function exportGenericReportPDF(report: any, res: Response, organizationId?: string): Promise<void> {
  const { Report } = await import('../models/Report');
  const df = report.dateFrom ? new Date(report.dateFrom) : new Date(0);
  const dt = report.dateTo   ? new Date(report.dateTo)   : new Date();
  const period = format(df, 'yyyy-MM');

  let rows: Record<string, any>[] = [];
  let cols: PDFCol[] = [];
  let title = report.title || 'Report';

  if (report.reportType === 'daily_floor_check' || report.reportType === 'daily_project_summary') {
    cols = [
      { header: 'Date',        key: 'date',  width: 70 },
      { header: 'Floor',       key: 'floor', width: 80 },
      { header: 'Supervisor',  key: 'sup',   width: 110 },
      { header: 'Shift',       key: 'shift', width: 55 },
      { header: 'Items',       key: 'items', width: 45, align: 'center' },
      { header: 'Status',      key: 'status',width: 80, status: true },
      { header: 'Notes',       key: 'notes', width: 75 },
    ];
    const filter: any = { date: { $gte: df, $lte: dt } };
    if (organizationId) filter.organization = organizationId;
    if (report.project) filter.project = report.project;
    if (report.floor)   filter.floor   = report.floor;
    const checks = await FloorCheck.find(filter).populate('floor', 'name').populate('supervisor', 'fullName').lean();
    rows = checks.map((c: any) => ({
      date:  format(new Date(c.date), 'dd/MM/yyyy'),
      floor: c.floor?.name || '—',
      sup:   c.supervisor?.fullName || '—',
      shift: c.shift,
      items: '—',
      status: c.status,
      notes: c.notes || '',
    }));
  } else if (report.reportType === 'weekly_warehouse') {
    cols = [
      { header: 'Date',     key: 'date',  width: 70 },
      { header: 'Item',     key: 'item',  width: 140 },
      { header: 'Unit',     key: 'unit',  width: 45 },
      { header: 'Type',     key: 'type',  width: 70 },
      { header: 'Quantity', key: 'qty',   width: 60, align: 'center' },
      { header: 'Source',   key: 'source',width: 80 },
      { header: 'Notes',    key: 'notes', width: 50 },
    ];
    const filter: any = { movementDate: { $gte: df, $lte: dt } };
    if (organizationId) filter.organization = organizationId;
    if (report.project) filter.project = report.project;
    const mvts = await StockMovement.find(filter).populate('item', 'name unit').lean();
    rows = mvts.map((m: any) => ({
      date:   format(new Date(m.movementDate), 'dd/MM/yyyy'),
      item:   m.item?.name || '—',
      unit:   m.item?.unit || '—',
      type:   m.movementType,
      qty:    String(m.quantity),
      source: m.sourceType || '—',
      notes:  m.notes || '',
    }));
  }

  const meta: MetaEntry[] = [
    { label: 'Report',    value: title },
    { label: 'Period',    value: `${format(df,'dd/MM/yyyy')} – ${format(dt,'dd/MM/yyyy')}` },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];

  await buildPDF(res, `${safeName(title.replace(/[^a-zA-Z0-9]/g,'_').replace(/_+/g,'_'))}.pdf`, title, undefined, meta, cols.length ? cols : [{ header: 'Data', key: 'data', width: PW - M*2 }], rows.length ? rows : [{ data: 'No data available' }], organizationId);
}

export async function exportSavedReportExcel(reportId: string, res: Response, organizationId?: string): Promise<void> {
  const { Report } = await import('../models/Report');
  const reportFilter: any = { _id: reportId };
  if (organizationId) reportFilter.organization = organizationId;
  const report = await Report.findOne(reportFilter).lean();
  if (!report) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

  const df = (report as any).dateFrom ? new Date((report as any).dateFrom) : undefined;
  const dt = (report as any).dateTo   ? new Date((report as any).dateTo)   : undefined;
  const period = df ? format(df, 'yyyy-MM') : format(new Date(), 'yyyy-MM');

  switch ((report as any).reportType) {
    case 'monthly_food_inventory': return exportLowStockExcel(res, { period, type: 'food', organizationId });
    case 'monthly_materials':      return exportLowStockExcel(res, { period, type: 'material', organizationId });
    case 'approval_summary':       return exportAuditLogsExcel(res, { dateFrom: df, dateTo: dt, organizationId });
    default:                       return exportGenericReportExcel(report as any, res, organizationId);
  }
}

async function exportGenericReportExcel(report: any, res: Response, organizationId?: string): Promise<void> {
  const df = report.dateFrom ? new Date(report.dateFrom) : new Date(0);
  const dt = report.dateTo   ? new Date(report.dateTo)   : new Date();

  let rows: Record<string, any>[] = [];
  let cols: XLCol[] = [];
  const title = report.title || 'Report';

  if (report.reportType === 'daily_floor_check' || report.reportType === 'daily_project_summary') {
    cols = [
      { header: 'Date',       key: 'date',   width: 14 },
      { header: 'Floor',      key: 'floor',  width: 16 },
      { header: 'Supervisor', key: 'sup',    width: 24 },
      { header: 'Shift',      key: 'shift',  width: 12 },
      { header: 'Status',     key: 'status', width: 18, status: true },
      { header: 'Notes',      key: 'notes',  width: 28 },
    ];
    const filter: any = { date: { $gte: df, $lte: dt } };
    if (organizationId) filter.organization = organizationId;
    if (report.project) filter.project = report.project;
    if (report.floor)   filter.floor   = report.floor;
    const checks = await FloorCheck.find(filter).populate('floor','name').populate('supervisor','fullName').lean();
    rows = checks.map((c: any) => ({
      date:   format(new Date(c.date), 'dd/MM/yyyy'),
      floor:  c.floor?.name || '—',
      sup:    c.supervisor?.fullName || '—',
      shift:  c.shift,
      status: c.status,
      notes:  c.notes || '',
    }));
  } else if (report.reportType === 'weekly_warehouse') {
    cols = [
      { header: 'Date',        key: 'date',   width: 14 },
      { header: 'Item',        key: 'item',   width: 30 },
      { header: 'Unit',        key: 'unit',   width: 10 },
      { header: 'Type',        key: 'type',   width: 18 },
      { header: 'Quantity',    key: 'qty',    width: 12 },
      { header: 'Source',      key: 'source', width: 18 },
      { header: 'Notes',       key: 'notes',  width: 28 },
    ];
    const filter: any = { movementDate: { $gte: df, $lte: dt } };
    if (organizationId) filter.organization = organizationId;
    if (report.project) filter.project = report.project;
    const mvts = await StockMovement.find(filter).populate('item','name unit').lean();
    rows = mvts.map((m: any) => ({
      date:   format(new Date(m.movementDate), 'dd/MM/yyyy'),
      item:   m.item?.name || '—',
      unit:   m.item?.unit || '—',
      type:   m.movementType,
      qty:    m.quantity,
      source: m.sourceType || '—',
      notes:  m.notes || '',
    }));
  }

  const meta: MetaEntry[] = [
    { label: 'Period', value: `${format(df,'dd MMM yyyy')} – ${format(dt,'dd MMM yyyy')}` },
    { label: 'Records', value: String(rows.length) },
  ];

  const sheetName = title.slice(0, 31);
  await buildExcel(res, `${safeName(title.replace(/[^a-zA-Z0-9]/g,'_').replace(/_+/g,'_'))}.xlsx`, sheetName, title, meta, cols, rows, organizationId);
}

// ── Transfers (Daily Delivery) ────────────────────────────────────────────────
const TR_COLS_PDF: PDFCol[] = [
  { header: 'Transfer Date', key: 'date',      width: 75 },
  { header: 'Floor',         key: 'floor',     width: 90 },
  { header: 'Building',      key: 'building',  width: 90 },
  { header: 'Items',         key: 'lineCount', width: 40, align: 'center' },
  { header: 'Status',        key: 'status',    width: 65, status: true },
  { header: 'Created By',    key: 'createdBy', width: 95 },
  { header: 'Notes',         key: 'notes',     width: 60 },
];
const TR_COLS_XL: XLCol[] = [
  { header: 'Transfer Date', key: 'date',      width: 16 },
  { header: 'Floor',         key: 'floor',     width: 20 },
  { header: 'Building',      key: 'building',  width: 20 },
  { header: 'Line Items',    key: 'lineCount', width: 12 },
  { header: 'Status',        key: 'status',    width: 18, status: true },
  { header: 'Created By',    key: 'createdBy', width: 24 },
  { header: 'Confirmed By',  key: 'confirmedBy',width: 24 },
  { header: 'Confirmed At',  key: 'confirmedAt',width: 18 },
  { header: 'Notes',         key: 'notes',     width: 30 },
];

export async function exportTransfersPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.transferDate = {}; if (opts.dateFrom) filter.transferDate.$gte = opts.dateFrom; if (opts.dateTo) filter.transferDate.$lte = opts.dateTo; }
  const recs = await Transfer.find(filter).sort({ transferDate: -1 })
    .populate('floor', 'name').populate('building', 'name').populate('createdBy', 'fullName').lean();
  const rows = recs.map((r: any) => ({
    date:      format(new Date(r.transferDate), 'dd/MM/yyyy'),
    floor:     (r.floor as any)?.name || '—',
    building:  (r.building as any)?.name || '—',
    lineCount: String(r.lines?.length ?? 0),
    status:    r.status,
    createdBy: (r.createdBy as any)?.fullName || '—',
    notes:     r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Daily Delivery / Transfers' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom,'dd/MM/yyyy')} – ${format(opts.dateTo||new Date(),'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Daily_Delivery_Report')}.pdf`, 'Daily Delivery Report', undefined, meta, TR_COLS_PDF, rows, opts.organizationId);
}

export async function exportTransfersExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.transferDate = {}; if (opts.dateFrom) filter.transferDate.$gte = opts.dateFrom; if (opts.dateTo) filter.transferDate.$lte = opts.dateTo; }
  const recs = await Transfer.find(filter).sort({ transferDate: -1 })
    .populate('floor', 'name').populate('building', 'name')
    .populate('createdBy', 'fullName').populate('confirmedBy', 'fullName').lean();
  const rows = recs.map((r: any) => ({
    date:        format(new Date(r.transferDate), 'dd/MM/yyyy'),
    floor:       (r.floor as any)?.name || '—',
    building:    (r.building as any)?.name || '—',
    lineCount:   r.lines?.length ?? 0,
    status:      r.status,
    createdBy:   (r.createdBy as any)?.fullName || '—',
    confirmedBy: (r.confirmedBy as any)?.fullName || '—',
    confirmedAt: r.confirmedAt ? format(new Date(r.confirmedAt), 'dd/MM/yyyy HH:mm') : '—',
    notes:       r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom,'dd MMM yyyy')} – ${format(opts.dateTo||new Date(),'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Daily_Delivery_Report')}.xlsx`, 'Transfers', 'Daily Delivery Report', meta, TR_COLS_XL, rows, opts.organizationId);
}

// ── Daily Plans (Menu Report) ─────────────────────────────────────────────────
const DP_COLS_PDF: PDFCol[] = [
  { header: 'Date',          key: 'date',      width: 72 },
  { header: 'Shift',         key: 'shift',     width: 60 },
  { header: 'Building',      key: 'building',  width: 110 },
  { header: 'Plan Lines',    key: 'lineCount', width: 55, align: 'center' },
  { header: 'Status',        key: 'status',    width: 70, status: true },
  { header: 'Created By',    key: 'createdBy', width: 90 },
  { header: 'Notes',         key: 'notes',     width: 58 },
];
const DP_COLS_XL: XLCol[] = [
  { header: 'Date',         key: 'date',      width: 16 },
  { header: 'Shift',        key: 'shift',     width: 14 },
  { header: 'Building',     key: 'building',  width: 24 },
  { header: 'Plan Lines',   key: 'lineCount', width: 12 },
  { header: 'Status',       key: 'status',    width: 18, status: true },
  { header: 'Created By',   key: 'createdBy', width: 24 },
  { header: 'Notes',        key: 'notes',     width: 30 },
];

export async function exportDailyPlansPDF(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.date = {}; if (opts.dateFrom) filter.date.$gte = opts.dateFrom; if (opts.dateTo) filter.date.$lte = opts.dateTo; }
  const recs = await DailyPlan.find(filter).sort({ date: -1 })
    .populate('building', 'name').populate('createdBy', 'fullName').lean();
  const rows = recs.map((r: any) => ({
    date:      format(new Date(r.date), 'dd/MM/yyyy'),
    shift:     r.shift,
    building:  (r.building as any)?.name || '—',
    lineCount: String(r.lines?.length ?? 0),
    status:    r.status,
    createdBy: (r.createdBy as any)?.fullName || '—',
    notes:     r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Daily Menu / Plans' },
    { label: 'Period',    value: opts.dateFrom ? `${format(opts.dateFrom,'dd/MM/yyyy')} – ${format(opts.dateTo||new Date(),'dd/MM/yyyy')}` : 'All time' },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Menu_Report')}.pdf`, 'Daily Menu Report', undefined, meta, DP_COLS_PDF, rows, opts.organizationId);
}

export async function exportDailyPlansExcel(res: Response, opts: { dateFrom?: Date; dateTo?: Date; organizationId?: string } = {}) {
  const filter: any = {};
  if (opts.organizationId) filter.organization = opts.organizationId;
  if (opts.dateFrom || opts.dateTo) { filter.date = {}; if (opts.dateFrom) filter.date.$gte = opts.dateFrom; if (opts.dateTo) filter.date.$lte = opts.dateTo; }
  const recs = await DailyPlan.find(filter).sort({ date: -1 })
    .populate('building', 'name').populate('createdBy', 'fullName').lean();
  const rows = recs.map((r: any) => ({
    date:      format(new Date(r.date), 'dd/MM/yyyy'),
    shift:     r.shift,
    building:  (r.building as any)?.name || '—',
    lineCount: r.lines?.length ?? 0,
    status:    r.status,
    createdBy: (r.createdBy as any)?.fullName || '—',
    notes:     r.notes || '',
  }));
  const meta: MetaEntry[] = [
    { label: 'Period', value: opts.dateFrom ? `${format(opts.dateFrom,'dd MMM yyyy')} – ${format(opts.dateTo||new Date(),'dd MMM yyyy')}` : 'All time' },
    { label: 'Records', value: String(rows.length) },
  ];
  await buildExcel(res, `${safeName('Menu_Report')}.xlsx`, 'Daily Plans', 'Daily Menu Report', meta, DP_COLS_XL, rows, opts.organizationId);
}

// ── Food Inventory (separate typed export) ────────────────────────────────────
export async function exportFoodInventoryPDF(res: Response, opts: { period?: string; organizationId?: string } = {}) {
  const period = opts.period || format(new Date(), 'yyyy-MM');
  const orgFilter = opts.organizationId ? { organization: opts.organizationId } : {};
  const balances = await InventoryBalance.find({ ...orgFilter, period })
    .populate({ path: 'item', match: { type: 'food' }, populate: { path: 'category', select: 'name' } }).lean();
  const rows = balances.filter((b: any) => b.item).map((b: any) => ({
    itemName:  b.item?.name || '—',
    category:  b.item?.category?.name || '—',
    unit:      b.item?.unit || '—',
    limit:     String(b.monthlyLimit),
    opening:   String(b.openingBalance),
    received:  String(b.receivedQty),
    consumed:  String(b.consumedQty ?? b.issuedQty ?? 0),
    remaining: String(b.remainingQty),
    status:    b.status,
  }));
  const cols: PDFCol[] = [
    { header: 'Item Name',    key: 'itemName',  width: 150 },
    { header: 'Category',     key: 'category',  width: 85 },
    { header: 'Unit',         key: 'unit',      width: 35 },
    { header: 'Limit',        key: 'limit',     width: 45, align: 'center' },
    { header: 'Opening',      key: 'opening',   width: 45, align: 'center' },
    { header: 'Received',     key: 'received',  width: 45, align: 'center' },
    { header: 'Consumed',     key: 'consumed',  width: 45, align: 'center' },
    { header: 'Remaining',    key: 'remaining', width: 50, align: 'center' },
    { header: 'Status',       key: 'status',    width: 55, status: true },
  ];
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Food Inventory' },
    { label: 'Period',    value: period },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Food_Inventory_Report')}.pdf`, 'Food Inventory Report', period, meta, cols, rows, opts.organizationId);
}

export async function exportMaterialsInventoryPDF(res: Response, opts: { period?: string; organizationId?: string } = {}) {
  const period = opts.period || format(new Date(), 'yyyy-MM');
  const orgFilter = opts.organizationId ? { organization: opts.organizationId } : {};
  const balances = await InventoryBalance.find({ ...orgFilter, period })
    .populate({ path: 'item', match: { type: 'material' }, populate: { path: 'category', select: 'name' } }).lean();
  const rows = balances.filter((b: any) => b.item).map((b: any) => ({
    itemName:  b.item?.name || '—',
    category:  b.item?.category?.name || '—',
    unit:      b.item?.unit || '—',
    limit:     String(b.monthlyLimit),
    opening:   String(b.openingBalance),
    received:  String(b.receivedQty),
    issued:    String(b.issuedQty ?? 0),
    remaining: String(b.remainingQty),
    status:    b.status,
  }));
  const cols: PDFCol[] = [
    { header: 'Item Name',    key: 'itemName',  width: 150 },
    { header: 'Category',     key: 'category',  width: 85 },
    { header: 'Unit',         key: 'unit',      width: 35 },
    { header: 'Limit',        key: 'limit',     width: 45, align: 'center' },
    { header: 'Opening',      key: 'opening',   width: 45, align: 'center' },
    { header: 'Received',     key: 'received',  width: 45, align: 'center' },
    { header: 'Issued',       key: 'issued',    width: 45, align: 'center' },
    { header: 'Remaining',    key: 'remaining', width: 50, align: 'center' },
    { header: 'Status',       key: 'status',    width: 55, status: true },
  ];
  const meta: MetaEntry[] = [
    { label: 'Report',    value: 'Materials Inventory' },
    { label: 'Period',    value: period },
    { label: 'Records',   value: String(rows.length) },
    { label: 'Generated', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
  ];
  await buildPDF(res, `${safeName('Materials_Inventory_Report')}.pdf`, 'Materials Inventory Report', period, meta, cols, rows, opts.organizationId);
}

// ── Re-export improved floor check exporters ──────────────────────────────────
export { generateFloorCheckPDF, generateFloorCheckExcel, generateInventoryExcel } from './reportService';
