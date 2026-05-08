import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, X, CheckCircle2, ArrowRightLeft, Layers, Download } from 'lucide-react';
import apiClient from '../../api/client';
import { downloadExport } from '../../utils/downloadExport';
import toast from 'react-hot-toast';
import { Transfer } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

interface TransferForm {
  project: string;
  building: string;
  floor: string;
  transferDate: string;
  notes: string;
  lines: { itemId: string; itemName: string; unit: string; quantity: string; notes: string }[];
}

const EMPTY_FORM: TransferForm = {
  project: '', building: '', floor: '',
  transferDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '', lines: [],
};

export function TransfersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TransferForm>(EMPTY_FORM);
  const [itemSearch, setItemSearch] = useState('');
  const [success, setSuccess] = useState('');

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers', page, statusFilter],
    queryFn: () => apiClient.get('/transfers', { params: { page, limit: 20, status: statusFilter || undefined } }).then(r => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });

  const { data: buildingsData } = useQuery({
    queryKey: ['buildings-list', form.project],
    queryFn: () => apiClient.get('/buildings', { params: { limit: 50, project: form.project || undefined } }).then(r => r.data),
    enabled: !!form.project,
  });

  const { data: floorsData } = useQuery({
    queryKey: ['floors-list', form.building],
    queryFn: () => apiClient.get('/floors', { params: { limit: 50, building: form.building || undefined } }).then(r => r.data),
    enabled: !!form.building,
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-all'],
    queryFn: () => apiClient.get('/items', { params: { limit: 200 } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/transfers', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(t('transfers.createdSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/transfers/${id}/confirm`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      setSuccess(t('transfers.confirmedSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  if (isLoading) return <PageLoader />;

  const transfers: Transfer[] = transfersData?.data || [];
  const projects = projectsData?.data || [];
  const buildings = buildingsData?.data || [];
  const floors = floorsData?.data || [];
  const items = itemsData?.data || [];
  const filteredItems = itemSearch
    ? items.filter((i: any) => i.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : items.slice(0, 8);

  function addLine(item: any) {
    setForm(f => ({ ...f, lines: [...f.lines, { itemId: item._id, itemName: item.name, unit: item.unit, quantity: '', notes: '' }] }));
    setItemSearch('');
  }

  function removeLine(idx: number) {
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  }

  function updateLine(idx: number, field: string, value: string) {
    setForm(f => {
      const lines = [...f.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...f, lines };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project || !form.building || !form.floor || form.lines.length === 0) return;
    createMutation.mutate({
      project: form.project,
      building: form.building,
      floor: form.floor,
      transferDate: form.transferDate,
      notes: form.notes,
      lines: form.lines.map(l => ({ item: l.itemId, quantity: Number(l.quantity), notes: l.notes })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('transfers.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('transfers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadExport('/export/transfers/pdf', `Mirsad_Daily_Delivery_${new Date().toISOString().slice(0,10)}.pdf`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => downloadExport('/export/transfers/excel', `Mirsad_Daily_Delivery_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(f => !f)} className="btn-primary flex items-center gap-2">
            {showForm ? <><X className="h-4 w-4" />{t('common.cancel')}</> : <><Plus className="h-4 w-4" />{t('transfers.new')}</>}
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
            {t('transfers.new')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
              <select className="input w-full" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value, building: '', floor: '' }))} required>
                <option value="">{t('common.selectProject')}</option>
                {projects.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')} *</label>
              <select className="input w-full" value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value, floor: '' }))} required disabled={!form.project}>
                <option value="">{t('common.selectBuilding')}</option>
                {buildings.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.floor')} *</label>
              <select className="input w-full" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} required disabled={!form.building}>
                <option value="">{t('common.select')}</option>
                {floors.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')}</label>
              <input type="date" className="input w-full" value={form.transferDate} onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
              <input className="input w-full" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('transfers.addItems')}</label>
            <input
              className="input w-full mb-2"
              placeholder={t('common.searchItems')}
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
            />
            {itemSearch && (
              <div className="border border-slate-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto mb-2">
                {filteredItems.length === 0 && <p className="px-3 py-2 text-slate-400 text-sm">{t('common.noResults')}</p>}
                {filteredItems.map((item: any) => (
                  <button key={item._id} type="button" className="w-full text-start px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    onClick={() => addLine(item)}>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-slate-400 ms-2 text-xs">{item.unit}</span>
                  </button>
                ))}
              </div>
            )}
            {form.lines.length > 0 && (
              <div className="space-y-2">
                {form.lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <span className="flex-1 text-sm font-medium text-slate-700">{line.itemName}</span>
                    <span className="text-xs text-slate-400">{line.unit}</span>
                    <input
                      type="number" min="1" placeholder={t('common.quantity')}
                      className="input w-24 text-sm" value={line.quantity} required
                      onChange={e => updateLine(i, 'quantity', e.target.value)}
                    />
                    <button type="button" onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || form.lines.length === 0}>
              {createMutation.isPending ? t('common.saving') : t('common.create')}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          {['draft', 'confirmed', 'cancelled'].map(s => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.date'), t('common.floor'), t('transfers.items'), t('common.status'), t('common.createdBy'), t('common.actions')].map(h => (
                <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
            ) : transfers.map((tr) => (
              <tr key={tr._id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-slate-400 text-xs">{format(new Date(tr.transferDate), 'dd MMM yyyy')}</td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    {(tr.floor as any)?.name || '—'}
                  </div>
                  <p className="text-xs text-slate-400">{(tr.building as any)?.name}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{tr.lines.length} {t('transfers.linesCount')}</td>
                <td className="px-3 py-3"><StatusBadge status={tr.status} /></td>
                <td className="px-3 py-3 text-slate-500 text-xs">{(tr.createdBy as any)?.fullName || '—'}</td>
                <td className="px-3 py-3">
                  {tr.status === 'draft' && (
                    <button
                      onClick={() => confirmMutation.mutate(tr._id)}
                      disabled={confirmMutation.isPending}
                      className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      {t('transfers.confirm')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfersData?.pagination && <Pagination pagination={transfersData.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
