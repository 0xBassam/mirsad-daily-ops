import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../../api/client';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface LineForm { itemId: string; itemName: string; unit: string; approvedQty: string; }

interface ParsedRow {
  rawName: string;
  rawUnit: string;
  rawQty: string;
  rawUnitPrice: string;
  rawTotalPrice: string;
  matchedItemId: string;
  matchedItemName: string;
  matchedUnit: string;
  approvedQty: string;
  status: 'matched' | 'unmatched' | 'invalid';
}

// ─── Header detection helpers ────────────────────────────────────────────────

const HEADER_CANDIDATES: Record<string, string[]> = {
  name:       ['المواد', 'مواد', 'اسم المادة', 'اسم البند', 'الصنف', 'البند', 'الاسم', 'item name', 'item', 'name', 'sku', 'code'],
  unit:       ['الوحدة', 'وحدة', 'unit'],
  qty:        ['الكمية', 'الكميه', 'كمية', 'كميه', 'quantity', 'qty', 'approved qty', 'approved'],
  unitPrice:  ['السعر الفردي', 'سعر الوحدة', 'سعر فردي', 'unit price', 'price', 'السعر'],
  totalPrice: ['السعر الإجمالي', 'الإجمالي', 'إجمالي', 'total price', 'total'],
};

function norm(s: unknown): string {
  return String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Returns header cell index for the first candidate that is found (exact then includes)
function findCol(headerRow: string[], candidates: string[]): number {
  // 1. Exact match (normalised)
  for (const c of candidates) {
    const nc = norm(c);
    const idx = headerRow.findIndex(h => norm(h) === nc);
    if (idx !== -1) return idx;
  }
  // 2. Substring match (header includes candidate)
  for (const c of candidates) {
    const nc = norm(c);
    const idx = headerRow.findIndex(h => norm(h).includes(nc) && nc.length > 2);
    if (idx !== -1) return idx;
  }
  return -1;
}

// Scan first `maxRows` rows to find the actual header row
function detectHeaderRow(rows: unknown[][], maxRows = 30): { rowIdx: number; colMap: Record<string, number> } | null {
  for (let rowIdx = 0; rowIdx < Math.min(maxRows, rows.length); rowIdx++) {
    const row = (rows[rowIdx] as unknown[]).map(c => String(c ?? '').trim());
    const colMap: Record<string, number> = {};
    for (const [field, candidates] of Object.entries(HEADER_CANDIDATES)) {
      const col = findCol(row, candidates);
      if (col !== -1) colMap[field] = col;
    }
    // Must have at least item name + quantity to be a valid header
    if ('name' in colMap && 'qty' in colMap) return { rowIdx, colMap };
  }
  return null;
}

// ─── Row classification ───────────────────────────────────────────────────────

// Words that appear in category/section divider rows (never in item names)
const CATEGORY_KEYWORDS = ['المجموع', 'الإجمالي', 'المعدات', 'الموارد البشرية', 'خدمات كوفي'];

function isCategoryOrTotalRow(cells: string[]): boolean {
  const joined = cells.join(' ');
  return CATEGORY_KEYWORDS.some(kw => joined.includes(kw));
}

// ─── Excel parser ─────────────────────────────────────────────────────────────

interface ExcelParseResult {
  rows: ParsedRow[];
  headerRowIdx: number;
  colMap: Record<string, number>;
  warnings: string[];
}

function parseExcelBuffer(buffer: ArrayBuffer, items: any[]): ExcelParseResult {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  const detected = detectHeaderRow(raw);
  if (!detected) {
    throw new Error(
      'لم يتم العثور على صف الترويسة. تأكد من وجود عمودَي "المواد" و"الكمية" في الملف.\n' +
      'Could not find header row — file must contain "المواد" and "الكمية" columns.'
    );
  }

  const { rowIdx: headerRowIdx, colMap } = detected;
  const warnings: string[] = [];

  const get = (row: unknown[], col: number | undefined): string => {
    if (col === undefined || col === -1) return '';
    const v = row[col];
    return v === null || v === undefined ? '' : String(v).trim();
  };

  const parsedRows: ParsedRow[] = [];

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];

    // Skip fully empty rows
    const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonEmpty.length === 0) continue;

    const rawName       = get(row, colMap.name);
    const rawUnit       = get(row, colMap.unit);
    const rawQty        = get(row, colMap.qty);
    const rawUnitPrice  = get(row, colMap.unitPrice);
    const rawTotalPrice = get(row, colMap.totalPrice);

    // Skip rows without an item name
    if (!rawName) continue;

    // Skip category / total rows
    const cells = row.slice(0, 8).map(c => String(c ?? ''));
    if (isCategoryOrTotalRow([rawName, rawUnit, ...cells])) continue;

    const qty        = parseFloat(rawQty.replace(/,/g, ''));
    const unitPrice  = parseFloat(rawUnitPrice.replace(/,/g, ''));
    const totalPrice = parseFloat(rawTotalPrice.replace(/,/g, ''));

    const invalid = !rawName || isNaN(qty) || qty <= 0;

    // Fuzzy match against database items
    const normName = norm(rawName);
    let matched: any = null;
    if (!invalid) {
      matched =
        items.find((it: any) => norm(it.name) === normName) ||
        items.find((it: any) => norm(it.name).includes(normName) && normName.length > 3) ||
        items.find((it: any) => normName.includes(norm(it.name)) && norm(it.name).length > 3) ||
        (items.find((it: any) => {
          const a = norm(it.name).split(' ');
          const b = normName.split(' ');
          const shared = a.filter(w => b.includes(w) && w.length > 2).length;
          return shared >= 2;
        })) || null;
    }

    if (!matched && !invalid) warnings.push(rawName);

    parsedRows.push({
      rawName,
      rawUnit,
      rawQty,
      rawUnitPrice:  isNaN(unitPrice)  ? rawUnitPrice  : unitPrice.toLocaleString(),
      rawTotalPrice: isNaN(totalPrice) ? rawTotalPrice : totalPrice.toLocaleString(),
      matchedItemId:   matched?._id  || '',
      matchedItemName: matched?.name || '',
      matchedUnit:     matched?.unit || rawUnit,
      approvedQty:     invalid ? '' : String(qty),
      status: invalid ? 'invalid' : matched ? 'matched' : 'unmatched',
    });
  }

  return { rows: parsedRows, headerRowIdx, colMap, warnings };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseOrderFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart   = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const monthEnd     = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');

  const [mode, setMode]           = useState<'manual' | 'excel'>('manual');
  const [supplierId, setSupplierId]   = useState('');
  const [projectId, setProjectId]     = useState('');
  const [month, setMonth]             = useState(currentMonth);
  const [startDate, setStartDate]     = useState(monthStart);
  const [endDate, setEndDate]         = useState(monthEnd);
  const [notes, setNotes]             = useState('');
  const [lines, setLines]             = useState<LineForm[]>([{ itemId: '', itemName: '', unit: '', approvedQty: '' }]);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName]     = useState('');
  const [parsing, setParsing]       = useState(false);

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => apiClient.get('/suppliers', { params: { limit: 100, status: 'active' } }).then(r => r.data),
  });
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });
  const { data: itemsData } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => apiClient.get('/items', { params: { limit: 200, status: 'active' } }).then(r => r.data),
  });

  const items: any[] = itemsData?.data || [];

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/purchase-orders', body).then(r => r.data),
    onSuccess: (res) => {
      toast.success('Purchase order created');
      navigate(`/purchase-orders/${res.data._id}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || t('common.error')),
  });

  function setLine(idx: number, field: keyof LineForm, value: string) {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'itemId') {
        const item = items.find((i: any) => i._id === value);
        if (item) { next[idx].itemName = item.name; next[idx].unit = item.unit; }
      }
      return next;
    });
  }
  function addLine()              { setLines(p => [...p, { itemId: '', itemName: '', unit: '', approvedQty: '' }]); }
  function removeLine(idx: number){ setLines(p => p.filter((_, i) => i !== idx)); }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseExcelBuffer(ev.target!.result as ArrayBuffer, items);
        setParsedRows(result.rows);
        const m = result.rows.filter(r => r.status === 'matched').length;
        const u = result.rows.filter(r => r.status === 'unmatched').length;
        const inv = result.rows.filter(r => r.status === 'invalid').length;
        toast.success(`تم تحليل ${result.rows.length} صف — ${m} مطابق، ${u} غير مطابق، ${inv} غير صالح`);
        if (result.warnings.length > 0) {
          console.warn('Unmatched items:', result.warnings);
        }
      } catch (err: any) {
        toast.error(err.message || 'فشل تحليل ملف Excel');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    // reset so the same file can be re-uploaded if items load later
    e.target.value = '';
  }

  function updateParsedQty(idx: number, value: string) {
    setParsedRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, approvedQty: value }));
  }

  function updateParsedItem(idx: number, itemId: string) {
    setParsedRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const item = items.find((it: any) => it._id === itemId);
      return {
        ...r,
        matchedItemId:   itemId,
        matchedItemName: item?.name || '',
        matchedUnit:     item?.unit || r.rawUnit,
        status: itemId ? 'matched' : 'unmatched',
      };
    }));
  }

  function importExcelLines() {
    const valid = parsedRows.filter(r => r.matchedItemId && Number(r.approvedQty) > 0);
    if (!valid.length) { toast.error('لا توجد صفوف مطابقة صالحة للاستيراد'); return; }
    setLines(valid.map(r => ({ itemId: r.matchedItemId, itemName: r.matchedItemName, unit: r.matchedUnit, approvedQty: r.approvedQty })));
    setMode('manual');
    toast.success(`تم استيراد ${valid.length} صف — راجع البنود ثم أنشئ أمر الشراء`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || !projectId) { toast.error('Supplier and project are required'); return; }
    const validLines = lines.filter(l => l.itemId && Number(l.approvedQty) > 0);
    if (!validLines.length) { toast.error('Add at least one item with quantity'); return; }
    const poNumber = `PO-${month}-${Date.now().toString().slice(-5)}`;
    mutation.mutate({
      poNumber, supplier: supplierId, project: projectId,
      month, startDate, endDate, notes,
      lines: validLines.map(l => ({ item: l.itemId, unit: l.unit, approvedQty: Number(l.approvedQty) })),
    });
  }

  if (suppliersLoading || projectsLoading) return <PageLoader />;

  const suppliers: any[] = suppliersData?.data || [];
  const projects: any[]  = projectsData?.data || [];

  const matchedCount   = parsedRows.filter(r => r.status === 'matched').length;
  const unmatchedCount = parsedRows.filter(r => r.status === 'unmatched').length;
  const invalidCount   = parsedRows.filter(r => r.status === 'invalid').length;

  return (
    <form onSubmit={submit} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-indigo-500" />
            {t('purchaseOrders.new')}
          </h1>
          <p className="text-slate-500 text-sm">{t('purchaseOrders.newSubtitle', 'Create a new purchase order')}</p>
        </div>
      </div>

      {/* PO Details */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-500">{t('common.details')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.supplier')} *</label>
            <select className="input w-full" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
              <option value="">{t('common.select')}</option>
              {suppliers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
            <select className="input w-full" value={projectId} onChange={e => setProjectId(e.target.value)} required>
              <option value="">{t('common.select')}</option>
              {projects.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('purchaseOrders.month')} *</label>
            <input type="month" className="input w-full" value={month} onChange={e => setMonth(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.from')} *</label>
              <input type="date" className="input w-full" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.to')} *</label>
              <input type="date" className="input w-full" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
          <textarea className="input w-full" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Line Items — mode toggle */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-slate-800 text-sm">
            {t('purchaseOrders.lineItems')}{' '}
            {mode === 'manual' ? `(${lines.length})` : parsedRows.length > 0 ? `(${parsedRows.length} صف)` : ''}
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMode('manual')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              إدخال يدوي
            </button>
            <button type="button" onClick={() => setMode('excel')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${mode === 'excel' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> رفع Excel
            </button>
          </div>
        </div>

        {/* ── Manual mode ── */}
        {mode === 'manual' && (
          <>
            <div className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <div key={idx} className="px-5 py-4 grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('common.item')} *</label>
                    <select className="input w-full" value={line.itemId} onChange={e => setLine(idx, 'itemId', e.target.value)}>
                      <option value="">{t('common.select')}</option>
                      {items.map((item: any) => (
                        <option key={item._id} value={item._id}>{item.name} ({item.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('common.unit')}</label>
                    <input className="input w-full bg-slate-50" value={line.unit} readOnly placeholder="auto" />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('purchaseOrders.approvedQty')} *</label>
                    <input type="number" min="1" className="input w-full" value={line.approvedQty}
                      onChange={e => setLine(idx, 'approvedQty', e.target.value)} placeholder="0" />
                  </div>
                  <div className="col-span-1 flex justify-end pb-0.5">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <button type="button" onClick={addLine} className="btn-secondary text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> {t('common.addLine', 'Add Line')}
              </button>
            </div>
          </>
        )}

        {/* ── Excel mode ── */}
        {mode === 'excel' && (
          <div className="p-5 space-y-5">
            {/* Upload zone */}
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              {fileName ? (
                <p className="text-sm font-medium text-indigo-700">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">انقر لرفع ملف Excel</p>
                  <p className="text-xs text-slate-400 mt-1">يدعم .xlsx و .xls — يُقرأ أول ورقة تلقائياً</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Column guide */}
            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600" dir="rtl">
              <p className="font-semibold text-slate-700 mb-2">الأعمدة المطلوبة (الترتيب والاسم غير حساسَين):</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { col: 'المواد', req: true },
                  { col: 'الكمية', req: true },
                  { col: 'الوحدة', req: false },
                  { col: 'السعر الفردي', req: false },
                  { col: 'السعر الإجمالي', req: false },
                ].map(({ col, req }) => (
                  <div key={col} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${req ? 'bg-red-500' : 'bg-slate-400'}`} />
                    {col} {req && <span className="text-red-500">*</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Parsing indicator */}
            {parsing && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                جاري تحليل الملف...
              </div>
            )}

            {/* Summary badges */}
            {parsedRows.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {matchedCount} مطابق
                </span>
                {unmatchedCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                    <AlertCircle className="h-3.5 w-3.5" /> {unmatchedCount} غير مطابق
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                    <XCircle className="h-3.5 w-3.5" /> {invalidCount} غير صالح
                  </span>
                )}
              </div>
            )}

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm" dir="rtl">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-right w-6"></th>
                      <th className="px-3 py-2 text-right">المادة (Excel)</th>
                      <th className="px-3 py-2 text-right min-w-[180px]">الصنف المطابق</th>
                      <th className="px-3 py-2 text-right w-20">الوحدة</th>
                      <th className="px-3 py-2 text-right w-28">الكمية</th>
                      <th className="px-3 py-2 text-right w-28">السعر الفردي</th>
                      <th className="px-3 py-2 text-right w-28">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={
                        row.status === 'matched'   ? 'bg-white' :
                        row.status === 'unmatched' ? 'bg-amber-50' : 'bg-red-50'
                      }>
                        <td className="px-3 py-2">
                          {row.status === 'matched'   && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {row.status === 'unmatched' && <AlertCircle  className="h-4 w-4 text-amber-500" />}
                          {row.status === 'invalid'   && <XCircle      className="h-4 w-4 text-red-500"   />}
                        </td>
                        <td className="px-3 py-2 text-slate-600 max-w-[160px]">
                          <span className="block truncate" title={row.rawName}>{row.rawName}</span>
                        </td>
                        <td className="px-3 py-2">
                          {row.status === 'invalid' ? (
                            <span className="text-red-500 text-xs">كمية غير صالحة</span>
                          ) : (
                            <select
                              className="input py-1 text-sm w-full"
                              value={row.matchedItemId}
                              onChange={e => updateParsedItem(idx, e.target.value)}
                            >
                              <option value="">— اختر صنفاً —</option>
                              {items.map((item: any) => (
                                <option key={item._id} value={item._id}>{item.name} ({item.type})</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{row.matchedUnit || row.rawUnit || '—'}</td>
                        <td className="px-3 py-2">
                          {row.status !== 'invalid' && (
                            <input type="number" min="1" className="input py-1 text-sm w-24"
                              value={row.approvedQty}
                              onChange={e => updateParsedQty(idx, e.target.value)} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs text-right">{row.rawUnitPrice || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs text-right">{row.rawTotalPrice || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Import button + hint */}
            {parsedRows.length > 0 && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-slate-500">
                  الصفوف الغير مطابقة ستُحذف. يمكنك تغيير الصنف والكمية أعلاه قبل الاستيراد.
                </p>
                <button type="button" onClick={importExcelLines}
                  className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0"
                  disabled={matchedCount === 0}>
                  <CheckCircle2 className="h-4 w-4" />
                  استيراد {matchedCount} بند{matchedCount !== 1 ? '' : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          <ShoppingCart className="h-4 w-4" />
          {mutation.isPending ? t('common.saving') : t('purchaseOrders.create', 'Create Purchase Order')}
        </button>
      </div>
    </form>
  );
}
