import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react';
import apiClient from '../../api/client';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface LineForm { itemId: string; itemName: string; unit: string; approvedQty: string; }

export function PurchaseOrderFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart   = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const monthEnd     = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');

  const [supplierId, setSupplierId]   = useState('');
  const [projectId, setProjectId]     = useState('');
  const [month, setMonth]             = useState(currentMonth);
  const [startDate, setStartDate]     = useState(monthStart);
  const [endDate, setEndDate]         = useState(monthEnd);
  const [notes, setNotes]             = useState('');
  const [lines, setLines]             = useState<LineForm[]>([{ itemId: '', itemName: '', unit: '', approvedQty: '' }]);

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
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide text-slate-500">{t('common.details')}</h2>
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

      {/* Line Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">{t('purchaseOrders.lineItems')} ({lines.length})</h2>
          <button type="button" onClick={addLine} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> {t('common.addLine', 'Add Line')}
          </button>
        </div>

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
