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

interface LineForm { itemId: string; itemName: string; unit: string; approvedQty: string; notes?: string; }

interface ParsedRow {
  rawName: string;
  rawUnit: string;
  rawQty: string;
  rawNotes: string;
  matchedItemId: string;
  matchedItemName: string;
  matchedUnit: string;
  approvedQty: string;
  status: 'matched' | 'unmatched' | 'invalid';
}

function normalise(s: string) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }

function detectColumn(headers: string[], candidates: string[]): string | null {
  const norm = headers.map(normalise);
  for (const c of candidates) {
    const idx = norm.findIndex(h => h.includes(c));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

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

  // Excel upload state
  const [parsedRows, setParsedRows]   = useState<ParsedRow[]>([]);
  const [fileName, setFileName]       = useState('');
  const [parsing, setParsing]         = useState(false);

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

  function addLine() { setLines(p => [...p, { itemId: '', itemName: '', unit: '', approvedQty: '' }]); }
  function removeLine(idx: number) { setLines(p => p.filter((_, i) => i !== idx)); }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data   = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb     = XLSX.read(data, { type: 'array' });
        const ws     = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length < 2) { toast.error('Excel file is empty or has no data rows'); setParsing(false); return; }

        const headers: string[] = rows[0].map(String);
        const nameCol  = detectColumn(headers, ['item name', 'item', 'name', 'الاسم', 'اسم المادة', 'مادة', 'sku', 'code']);
        const unitCol  = detectColumn(headers, ['unit', 'وحدة', 'الوحدة']);
        const qtyCol   = detectColumn(headers, ['quantity', 'qty', 'approved qty', 'approved', 'كمية', 'الكمية']);
        const notesCol = detectColumn(headers, ['notes', 'note', 'ملاحظات', 'ملاحظة']);

        if (!nameCol || !qtyCol) {
          toast.error('Could not find required columns (Item Name, Quantity). Please check the Excel headers.');
          setParsing(false);
          return;
        }

        const parsed: ParsedRow[] = rows.slice(1)
          .filter(r => r.some((c: any) => String(c).trim() !== ''))
          .map(r => {
            const get = (col: string | null) => col ? String(r[headers.indexOf(col)] ?? '').trim() : '';
            const rawName  = get(nameCol);
            const rawUnit  = get(unitCol);
            const rawQty   = get(qtyCol);
            const rawNotes = get(notesCol);

            if (!rawName) return null;

            const qty = parseFloat(rawQty);
            if (isNaN(qty) || qty <= 0) {
              return { rawName, rawUnit, rawQty, rawNotes, matchedItemId: '', matchedItemName: '', matchedUnit: rawUnit, approvedQty: rawQty, status: 'invalid' as const };
            }

            const normName = normalise(rawName);
            const matched  = items.find((item: any) =>
              normalise(item.name) === normName ||
              normalise(item.name).includes(normName) ||
              normName.includes(normalise(item.name)) ||
              (item.sku && normalise(item.sku) === normName)
            );

            if (matched) {
              return { rawName, rawUnit, rawQty, rawNotes, matchedItemId: matched._id, matchedItemName: matched.name, matchedUnit: matched.unit, approvedQty: String(qty), status: 'matched' as const };
            }
            return { rawName, rawUnit, rawQty, rawNotes, matchedItemId: '', matchedItemName: '', matchedUnit: rawUnit, approvedQty: String(qty), status: 'unmatched' as const };
          })
          .filter(Boolean) as ParsedRow[];

        setParsedRows(parsed);
        setParsing(false);

        const matched   = parsed.filter(r => r.status === 'matched').length;
        const unmatched = parsed.filter(r => r.status === 'unmatched').length;
        const invalid   = parsed.filter(r => r.status === 'invalid').length;
        toast.success(`Parsed ${parsed.length} rows — ${matched} matched, ${unmatched} unmatched, ${invalid} invalid`);
      } catch {
        toast.error('Failed to parse Excel file. Please check the format.');
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateParsedQty(idx: number, value: string) {
    setParsedRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], approvedQty: value };
      return next;
    });
  }

  function updateParsedItem(idx: number, itemId: string) {
    setParsedRows(prev => {
      const next = [...prev];
      const item = items.find((i: any) => i._id === itemId);
      next[idx] = {
        ...next[idx],
        matchedItemId: itemId,
        matchedItemName: item?.name || '',
        matchedUnit: item?.unit || next[idx].rawUnit,
        status: itemId ? 'matched' : 'unmatched',
      };
      return next;
    });
  }

  function importExcelLines() {
    const validRows = parsedRows.filter(r => r.matchedItemId && Number(r.approvedQty) > 0);
    if (validRows.length === 0) { toast.error('No valid matched rows to import'); return; }
    setLines(validRows.map(r => ({ itemId: r.matchedItemId, itemName: r.matchedItemName, unit: r.matchedUnit, approvedQty: r.approvedQty, notes: r.rawNotes })));
    setMode('manual');
    toast.success(`${validRows.length} lines imported — review and submit`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || !projectId) { toast.error('Supplier and project are required'); return; }
    const validLines = lines.filter(l => l.itemId && Number(l.approvedQty) > 0);
    if (validLines.length === 0) { toast.error('Add at least one item with quantity'); return; }

    const poNumber = `PO-${month}-${Date.now().toString().slice(-5)}`;
    mutation.mutate({
      poNumber,
      supplier: supplierId,
      project: projectId,
      month,
      startDate,
      endDate,
      notes,
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
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
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
            {t('purchaseOrders.lineItems')} {mode === 'manual' ? `(${lines.length})` : `(${parsedRows.length} parsed)`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setMode('excel')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${mode === 'excel' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Upload Excel
            </button>
          </div>
        </div>

        {/* Manual mode */}
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

        {/* Excel mode */}
        {mode === 'excel' && (
          <div className="p-5 space-y-5">
            {/* Upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
            >
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              {fileName ? (
                <p className="text-sm font-medium text-indigo-700">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Click to upload Excel file</p>
                  <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls — first sheet used</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Column guide */}
            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-2">Expected columns (any order, case-insensitive):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { col: 'Item Name', req: true },
                  { col: 'Quantity', req: true },
                  { col: 'Unit', req: false },
                  { col: 'Notes', req: false },
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
                Parsing file...
              </div>
            )}

            {/* Summary badges */}
            {parsedRows.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {matchedCount} matched
                </span>
                {unmatchedCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                    <AlertCircle className="h-3.5 w-3.5" /> {unmatchedCount} unmatched
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                    <XCircle className="h-3.5 w-3.5" /> {invalidCount} invalid qty
                  </span>
                )}
              </div>
            )}

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left w-6"></th>
                      <th className="px-3 py-2 text-left">Excel Row</th>
                      <th className="px-3 py-2 text-left">Matched Item</th>
                      <th className="px-3 py-2 text-left w-24">Unit</th>
                      <th className="px-3 py-2 text-left w-28">Qty</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.status === 'matched' ? 'bg-white' : row.status === 'unmatched' ? 'bg-amber-50' : 'bg-red-50'}>
                        <td className="px-3 py-2">
                          {row.status === 'matched'   && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {row.status === 'unmatched' && <AlertCircle  className="h-4 w-4 text-amber-500" />}
                          {row.status === 'invalid'   && <XCircle      className="h-4 w-4 text-red-500"   />}
                        </td>
                        <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate" title={row.rawName}>{row.rawName}</td>
                        <td className="px-3 py-2">
                          {row.status === 'invalid' ? (
                            <span className="text-red-500 text-xs">Invalid quantity</span>
                          ) : (
                            <select
                              className="input py-1 text-sm w-full min-w-[160px]"
                              value={row.matchedItemId}
                              onChange={e => updateParsedItem(idx, e.target.value)}
                            >
                              <option value="">— select item —</option>
                              {items.map((item: any) => (
                                <option key={item._id} value={item._id}>{item.name} ({item.type})</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{row.matchedUnit || row.rawUnit || '—'}</td>
                        <td className="px-3 py-2">
                          {row.status !== 'invalid' && (
                            <input
                              type="number" min="1"
                              className="input py-1 text-sm w-24"
                              value={row.approvedQty}
                              onChange={e => updateParsedQty(idx, e.target.value)}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-xs max-w-[120px] truncate">{row.rawNotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Import button */}
            {parsedRows.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Unmatched rows will be skipped. You can edit quantities and item matches above before importing.
                </p>
                <button
                  type="button"
                  onClick={importExcelLines}
                  className="btn-primary text-sm flex items-center gap-1.5"
                  disabled={matchedCount === 0}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Import {matchedCount} Line{matchedCount !== 1 ? 's' : ''}
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
