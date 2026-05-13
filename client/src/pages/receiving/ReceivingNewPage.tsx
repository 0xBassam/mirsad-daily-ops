import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, Plus, X } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ReceivingLine {
  item: string;
  purchaseOrderLine: string;
  quantityOrdered: string;
  quantityReceived: string;
  condition: 'good' | 'damaged' | 'rejected';
  batchNumber: string;
  expiryDate: string;
  notes: string;
}

interface RForm {
  supplier: string;
  purchaseOrder: string;
  deliveryDate: string;
  invoiceNumber: string;
  notes: string;
  lines: ReceivingLine[];
}

const EMPTY_LINE: ReceivingLine = {
  item: '', purchaseOrderLine: '',
  quantityOrdered: '', quantityReceived: '',
  condition: 'good', batchNumber: '', expiryDate: '', notes: '',
};

const EMPTY: RForm = {
  supplier: '', purchaseOrder: '',
  deliveryDate: new Date().toISOString().split('T')[0],
  invoiceNumber: '', notes: '',
  lines: [{ ...EMPTY_LINE }],
};

export function ReceivingNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userProject = (user as any)?.project;
  const [form, setForm] = useState<RForm>(EMPTY);

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => apiClient.get('/suppliers', { params: { limit: 100, status: 'active' } }).then(r => r.data),
  });

  const { data: poData } = useQuery({
    queryKey: ['po-list', form.supplier],
    queryFn: () => apiClient.get('/purchase-orders', { params: { limit: 50, supplier: form.supplier || undefined, status: 'ordered' } }).then(r => r.data),
    enabled: !!form.supplier,
  });

  const { data: selectedPO } = useQuery({
    queryKey: ['po-detail', form.purchaseOrder],
    queryFn: () => apiClient.get(`/purchase-orders/${form.purchaseOrder}`).then(r => r.data.data),
    enabled: !!form.purchaseOrder,
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-active'],
    queryFn: () => apiClient.get('/items', { params: { limit: 200, status: 'active' } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/receiving', body).then(r => r.data),
    onSuccess: (res) => navigate(`/receiving/${res.data._id}`),
  });

  function setField(k: keyof Omit<RForm, 'lines'>, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    if (k === 'supplier') setForm(p => ({ ...p, supplier: v, purchaseOrder: '', lines: [{ ...EMPTY_LINE }] }));
    if (k === 'purchaseOrder') prefillFromPO(v);
  }

  function prefillFromPO(poId: string) {
    if (!poId) { setForm(p => ({ ...p, purchaseOrder: poId, lines: [{ ...EMPTY_LINE }] })); return; }
    // Lines will be prefilled once selectedPO query resolves
    setForm(p => ({ ...p, purchaseOrder: poId }));
  }

  // When selectedPO loads, auto-populate lines
  const poLines = selectedPO?.lines ?? [];
  function handlePOSelect(poId: string) {
    setForm(p => ({ ...p, purchaseOrder: poId }));
  }

  function populatePOLines() {
    if (!selectedPO?.lines?.length) return;
    setForm(p => ({
      ...p,
      supplier: selectedPO.supplier?._id ?? p.supplier,
      lines: selectedPO.lines.map((l: any) => ({
        item: typeof l.item === 'object' ? l.item._id : l.item,
        purchaseOrderLine: l._id,
        quantityOrdered: String(l.approvedQty ?? ''),
        quantityReceived: String(l.approvedQty ?? ''),
        condition: 'good' as const,
        batchNumber: '', expiryDate: '', notes: '',
      })),
    }));
  }

  function addLine() { setForm(p => ({ ...p, lines: [...p.lines, { ...EMPTY_LINE }] })); }
  function removeLine(i: number) { setForm(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) })); }
  function updateLine(i: number, k: keyof ReceivingLine, v: string) {
    setForm(p => { const lines = [...p.lines]; lines[i] = { ...lines[i], [k]: v }; return { ...p, lines }; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lines.length) return;
    mutation.mutate({
      project: userProject || undefined,
      supplier: form.supplier,
      purchaseOrder: form.purchaseOrder || undefined,
      deliveryDate: form.deliveryDate,
      invoiceNumber: form.invoiceNumber || undefined,
      notes: form.notes || undefined,
      lines: form.lines
        .filter(l => l.item)
        .map(l => ({
          item: l.item,
          purchaseOrderLine: l.purchaseOrderLine || undefined,
          quantityOrdered: Number(l.quantityOrdered) || 0,
          quantityReceived: Number(l.quantityReceived) || 0,
          condition: l.condition,
          batchNumber: l.batchNumber || undefined,
          expiryDate: l.expiryDate || undefined,
          notes: l.notes || undefined,
        })),
    });
  }

  const suppliers = suppliersData?.data ?? [];
  const purchaseOrders = poData?.data ?? [];
  const items = itemsData?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/receiving" className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
          ← {t('receiving.title')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Truck className="h-6 w-6 text-indigo-500" />{t('receiving.new')}
      </h1>

      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* Header */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('receiving.deliveryInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.supplier')} *</label>
              <select className="input w-full" value={form.supplier} onChange={e => setField('supplier', e.target.value)} required>
                <option value="">—</option>
                {suppliers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('receiving.poRef')}</label>
              <div className="flex gap-2">
                <select className="input flex-1" value={form.purchaseOrder} onChange={e => handlePOSelect(e.target.value)} disabled={!form.supplier}>
                  <option value="">— {t('receiving.noPO')}</option>
                  {purchaseOrders.map((po: any) => <option key={po._id} value={po._id}>{po.poNumber}</option>)}
                </select>
                {form.purchaseOrder && selectedPO && (
                  <button type="button" onClick={populatePOLines} className="btn-secondary text-xs whitespace-nowrap px-3">
                    {t('receiving.prefillLines')}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')} *</label>
              <input type="date" className="input w-full" value={form.deliveryDate} onChange={e => setField('deliveryDate', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('receiving.invoiceNumber')}</label>
              <input className="input w-full" value={form.invoiceNumber} onChange={e => setField('invoiceNumber', e.target.value)} placeholder={t('receiving.invoiceNumber')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
            <textarea className="input w-full" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>

        {/* Lines */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('receiving.lines')}</h2>
            <button type="button" onClick={addLine} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
              <Plus className="h-3 w-3" />{t('common.add')} {t('common.item')}
            </button>
          </div>

          {form.lines.map((line, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                {form.lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.item')} *</label>
                  <select className="input w-full text-sm" value={line.item} onChange={e => updateLine(i, 'item', e.target.value)} required>
                    <option value="">—</option>
                    {items.map((it: any) => <option key={it._id} value={it._id}>{it.name} ({it.unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('receiving.condition')}</label>
                  <select className="input w-full text-sm" value={line.condition} onChange={e => updateLine(i, 'condition', e.target.value)}>
                    <option value="good">{t('receiving.conditions.good')}</option>
                    <option value="damaged">{t('receiving.conditions.damaged')}</option>
                    <option value="rejected">{t('receiving.conditions.rejected')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('receiving.ordered')}</label>
                  <input type="number" min="0" className="input w-full text-sm" value={line.quantityOrdered} onChange={e => updateLine(i, 'quantityOrdered', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('receiving.received')} *</label>
                  <input type="number" min="0" className="input w-full text-sm" value={line.quantityReceived} onChange={e => updateLine(i, 'quantityReceived', e.target.value)} required placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('receiving.batchNumber')}</label>
                  <input className="input w-full text-sm" value={line.batchNumber} onChange={e => updateLine(i, 'batchNumber', e.target.value)} placeholder={t('receiving.batchNumber')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.expiryDate')}</label>
                  <input type="date" className="input w-full text-sm" value={line.expiryDate} onChange={e => updateLine(i, 'expiryDate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.notes')}</label>
                <input className="input w-full text-sm" value={line.notes} onChange={e => updateLine(i, 'notes', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <Link to="/receiving" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('receiving.createRecord')}
          </button>
        </div>
      </form>
    </div>
  );
}
