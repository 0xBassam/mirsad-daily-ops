import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Plus, X } from 'lucide-react';
import apiClient from '../../api/client';

const REQUEST_TYPES = ['operation_request','coffee_break_request','catering','maintenance','supplies','event','housekeeping','other'] as const;
const PRIORITIES    = ['low','medium','high','urgent'] as const;

interface CRForm {
  title: string; description: string;
  requestType: string; priority: string;
  project: string; building: string; floor: string;
  expectedDelivery: string; notes: string;
  items: { name: string; quantity: string; unit: string }[];
}
const EMPTY: CRForm = { title:'', description:'', requestType:'operation_request', priority:'medium', project:'', building:'', floor:'', expectedDelivery:'', notes:'', items:[] };

export function ClientRequestNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<CRForm>(EMPTY);

  const { data: projectsData } = useQuery({ queryKey: ['projects-list'], queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data) });
  const { data: buildingsData } = useQuery({ queryKey: ['buildings-list', form.project], queryFn: () => apiClient.get('/buildings', { params: { limit: 50, project: form.project || undefined } }).then(r => r.data), enabled: !!form.project });
  const { data: floorsData }    = useQuery({ queryKey: ['floors-list', form.building],  queryFn: () => apiClient.get('/floors',    { params: { limit: 50, building: form.building || undefined } }).then(r => r.data), enabled: !!form.building });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/client-requests', body).then(r => r.data),
    onSuccess: (res) => navigate(`/client-requests/${res.data._id}`),
  });

  function f(k: keyof CRForm, v: any) { setForm(p => ({ ...p, [k]: v })); }
  function addItem() { setForm(p => ({ ...p, items: [...p.items, { name:'', quantity:'1', unit:'' }] })); }
  function removeItem(i: number) { setForm(p => ({ ...p, items: p.items.filter((_,j) => j !== i) })); }
  function updateItem(i: number, k: string, v: string) {
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-indigo-500" />{t('clientRequests.new')}
      </h1>

      <form className="card p-6 space-y-4" onSubmit={e => {
        e.preventDefault();
        mutation.mutate({
          ...form,
          building: form.building || undefined,
          floor: form.floor || undefined,
          expectedDelivery: form.expectedDelivery || undefined,
          items: form.items.map(item => ({ ...item, quantity: Number(item.quantity), unit: item.unit || undefined })),
        });
      }}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.requestTitle')} *</label>
          <input className="input w-full" value={form.title} onChange={e => f('title', e.target.value)} required placeholder={t('clientRequests.titlePlaceholder')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('maintenance.description')} *</label>
          <textarea className="input w-full" rows={3} value={form.description} onChange={e => f('description', e.target.value)} required placeholder={t('clientRequests.descPlaceholder')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.type')} *</label>
            <select className="input w-full" value={form.requestType} onChange={e => f('requestType', e.target.value)}>
              {REQUEST_TYPES.map(r => <option key={r} value={r}>{t(`clientRequests.types.${r}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.priority')}</label>
            <select className="input w-full" value={form.priority} onChange={e => f('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{t(`status.${p}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
            <select className="input w-full" value={form.project} onChange={e => f('project', e.target.value)} required>
              <option value="">{t('common.selectProject')}</option>
              {(projectsData?.data || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')}</label>
            <select className="input w-full" value={form.building} onChange={e => f('building', e.target.value)} disabled={!form.project}>
              <option value="">{t('common.selectBuilding')}</option>
              {(buildingsData?.data || []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.dueDate')}</label>
            <input type="date" className="input w-full" value={form.expectedDelivery} onChange={e => f('expectedDelivery', e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">{t('clientRequests.requestedItems')}</label>
            <button type="button" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800" onClick={addItem}>
              <Plus className="h-3 w-3" />{t('clientRequests.addItem')}
            </button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input className="input flex-1" placeholder={t('common.name')} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} required />
              <input type="number" min="1" className="input w-20" placeholder={t('common.quantity')} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
              <input className="input w-20" placeholder={t('common.unit')} value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} />
              <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
          <textarea className="input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
