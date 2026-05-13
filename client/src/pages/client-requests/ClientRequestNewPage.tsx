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
  room: string; locationNotes: string;
  scheduledDate: string; scheduledTime: string;
  employeeName: string; employeeId: string;
  department: string; mobile: string;
  notes: string;
  items: { name: string; quantity: string; unit: string }[];
}

const EMPTY: CRForm = {
  title: '', description: '', requestType: 'operation_request', priority: 'medium',
  project: '', building: '', floor: '', room: '', locationNotes: '',
  scheduledDate: '', scheduledTime: '',
  employeeName: '', employeeId: '', department: '', mobile: '',
  notes: '', items: [],
};

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
  function addItem() { setForm(p => ({ ...p, items: [...p.items, { name: '', quantity: '1', unit: '' }] })); }
  function removeItem(i: number) { setForm(p => ({ ...p, items: p.items.filter((_, j) => j !== i) })); }
  function updateItem(i: number, k: string, v: string) {
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-indigo-500" />{t('clientRequests.new')}
      </h1>

      <form className="space-y-5" onSubmit={e => {
        e.preventDefault();
        mutation.mutate({
          ...form,
          building: form.building || undefined,
          floor: form.floor || undefined,
          room: form.room || undefined,
          locationNotes: form.locationNotes || undefined,
          scheduledDate: form.scheduledDate || undefined,
          scheduledTime: form.scheduledTime || undefined,
          employeeName: form.employeeName || undefined,
          employeeId: form.employeeId || undefined,
          department: form.department || undefined,
          mobile: form.mobile || undefined,
          items: form.items.map(item => ({ ...item, quantity: Number(item.quantity), unit: item.unit || undefined })),
        });
      }}>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('maintenance.description')}</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.requestTitle')} *</label>
            <input className="input w-full" value={form.title} onChange={e => f('title', e.target.value)} required placeholder={t('clientRequests.titlePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('maintenance.description')} *</label>
            <textarea className="input w-full" rows={3} value={form.description} onChange={e => f('description', e.target.value)} required placeholder={t('clientRequests.descPlaceholder')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Scheduling */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.scheduledFor')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.scheduledDate')} *</label>
              <input type="date" className="input w-full" value={form.scheduledDate} onChange={e => f('scheduledDate', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.scheduledTime')}</label>
              <input type="time" className="input w-full" value={form.scheduledTime} onChange={e => f('scheduledTime', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.serviceLocation')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
              <select className="input w-full" value={form.project} onChange={e => { f('project', e.target.value); f('building', ''); f('floor', ''); }} required>
                <option value="">{t('common.selectProject')}</option>
                {(projectsData?.data || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')}</label>
              <select className="input w-full" value={form.building} onChange={e => { f('building', e.target.value); f('floor', ''); }} disabled={!form.project}>
                <option value="">—</option>
                {(buildingsData?.data || []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.floor')}</label>
              <select className="input w-full" value={form.floor} onChange={e => f('floor', e.target.value)} disabled={!form.building}>
                <option value="">—</option>
                {(floorsData?.data || []).map((fl: any) => <option key={fl._id} value={fl._id}>{fl.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.room')}</label>
              <input className="input w-full" value={form.room} onChange={e => f('room', e.target.value)} placeholder={t('clientRequests.room')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.locationNotes')}</label>
            <input className="input w-full" value={form.locationNotes} onChange={e => f('locationNotes', e.target.value)} placeholder={t('common.locationNotes')} />
          </div>
        </div>

        {/* Employee Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.employeeInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.employeeName')} *</label>
              <input className="input w-full" value={form.employeeName} onChange={e => f('employeeName', e.target.value)} required placeholder={t('clientRequests.employeeName')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.employeeId')} *</label>
              <input className="input w-full" value={form.employeeId} onChange={e => f('employeeId', e.target.value)} required placeholder={t('clientRequests.employeeId')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.department')}</label>
              <input className="input w-full" value={form.department} onChange={e => f('department', e.target.value)} placeholder={t('clientRequests.department')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clientRequests.mobile')}</label>
              <input className="input w-full" type="tel" value={form.mobile} onChange={e => f('mobile', e.target.value)} placeholder="+966 5x xxx xxxx" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.requestedItems')}</h2>
            <button type="button" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium" onClick={addItem}>
              <Plus className="h-3 w-3" />{t('clientRequests.addItem')}
            </button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="input flex-1" placeholder={t('common.name')} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} required />
              <input type="number" min="1" className="input w-20" placeholder={t('common.quantity')} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
              <input className="input w-20" placeholder={t('common.unit')} value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} />
              <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
          {form.items.length === 0 && (
            <p className="text-xs text-slate-400">{t('common.noData')}</p>
          )}
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
          <textarea className="input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
