import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';
import { SpoilageRecord, SpoilageReason } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

const REASONS: SpoilageReason[] = ['expired', 'damaged', 'temperature_issue', 'packaging_issue', 'quality_issue', 'spoiled', 'other'];

const REASON_COLORS: Record<string, string> = {
  expired:          'bg-red-100 text-red-700',
  damaged:          'bg-orange-100 text-orange-700',
  temperature_issue:'bg-purple-100 text-purple-700',
  packaging_issue:  'bg-yellow-100 text-yellow-700',
  quality_issue:    'bg-pink-100 text-pink-700',
  spoiled:          'bg-rose-100 text-rose-700',
  other:            'bg-slate-100 text-slate-600',
};

interface SpoilageForm {
  itemSearch: string;
  itemId: string;
  quantity: string;
  reason: SpoilageReason | '';
  location: string;
  date: string;
  notes: string;
}

const EMPTY_FORM: SpoilageForm = {
  itemSearch: '', itemId: '', quantity: '', reason: '', location: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '',
};

export function SpoilageRecordingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SpoilageForm>(EMPTY_FORM);
  const [success, setSuccess] = useState(false);

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['spoilage-records', page],
    queryFn: () => apiClient.get('/spoilage', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-all'],
    queryFn: () => apiClient.get('/items', { params: { limit: 200 } }).then(r => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/spoilage', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spoilage-records'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  if (isLoading) return <PageLoader />;

  const records: SpoilageRecord[] = recordsData?.data || [];
  const items = itemsData?.data || [];
  const projects = projectsData?.data || [];
  const filteredItems = form.itemSearch
    ? items.filter((i: any) => i.name.toLowerCase().includes(form.itemSearch.toLowerCase()))
    : items.slice(0, 8);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemId || !form.quantity || !form.reason || !form.location) return;
    createMutation.mutate({
      item: form.itemId,
      project: projects[0]?._id,
      quantity: Number(form.quantity),
      reason: form.reason,
      location: form.location,
      date: form.date,
      notes: form.notes,
      alertType: form.reason === 'expired' ? 'expired'
        : form.reason === 'temperature_issue' ? 'temperature_breach'
        : form.reason === 'damaged' || form.reason === 'packaging_issue' ? 'damaged'
        : 'spoiled',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('spoilage.recordingTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('spoilage.recordingSubtitle')}</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary flex items-center gap-2">
          {showForm ? <><X className="h-4 w-4" /> {t('common.cancel')}</> : <><Plus className="h-4 w-4" /> {t('spoilage.record')}</>}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{t('spoilage.recordedSuccess')}</p>
        </div>
      )}

      {/* Record form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('spoilage.newRecord')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.item')} *</label>
              <input
                className="input w-full"
                placeholder={t('common.searchItems')}
                value={form.itemSearch}
                onChange={e => setForm(f => ({ ...f, itemSearch: e.target.value, itemId: '' }))}
              />
              {form.itemSearch && !form.itemId && (
                <div className="mt-1 border border-slate-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
                  {filteredItems.map((item: any) => (
                    <button
                      key={item._id} type="button"
                      className="w-full text-start px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      onClick={() => setForm(f => ({ ...f, itemSearch: item.name, itemId: item._id }))}
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-slate-400 ms-2 text-xs">{item.unit}</span>
                    </button>
                  ))}
                  {filteredItems.length === 0 && <p className="px-3 py-2 text-slate-400 text-sm">{t('common.noResults')}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.quantity')} *</label>
              <input type="number" min="1" className="input w-full" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('spoilage.reason')} *</label>
              <select className="input w-full" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value as SpoilageReason }))} required>
                <option value="">{t('common.select')}</option>
                {REASONS.map(r => <option key={r} value={r}>{t(`spoilage.reasons.${r}`)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('spoilage.location')} *</label>
              <input className="input w-full" placeholder={t('spoilage.locationPlaceholder')} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')}</label>
              <input type="date" className="input w-full" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
              <textarea className="input w-full" rows={2} placeholder={t('spoilage.notesPlaceholder')} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || !form.itemId || !form.reason}>
              {createMutation.isPending ? t('common.saving') : t('spoilage.record')}
            </button>
          </div>
        </form>
      )}

      {/* Records list */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.item'), t('common.quantity'), t('spoilage.reason'), t('spoilage.location'), t('common.date'), t('common.recordedBy')].map(h => (
                <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
            ) : records.map(r => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-medium text-slate-900">{r.item?.name || '—'}</td>
                <td className="px-3 py-3 text-slate-700">{r.quantity} {r.item?.unit}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[r.reason] || 'bg-slate-100 text-slate-600'}`}>
                    {t(`spoilage.reasons.${r.reason}`)}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-500">{r.location}</td>
                <td className="px-3 py-3 text-slate-400 text-xs">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                <td className="px-3 py-3 text-slate-500 text-xs">{r.createdBy?.fullName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recordsData?.pagination && <Pagination pagination={recordsData.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
