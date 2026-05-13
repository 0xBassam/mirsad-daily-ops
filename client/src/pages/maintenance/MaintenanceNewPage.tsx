import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['electrical','plumbing','hvac','equipment','cleaning','structural','other'] as const;
const PRIORITIES = ['low','medium','high','critical'] as const;

interface MRForm {
  title: string; description: string;
  building: string; floor: string;
  category: string; priority: string; notes: string;
}
const EMPTY: MRForm = { title:'', description:'', building:'', floor:'', category:'electrical', priority:'medium', notes:'' };

export function MaintenanceNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userProject = (user as any)?.project;
  const [form, setForm] = useState<MRForm>(EMPTY);

  const { data: buildingsData } = useQuery({ queryKey: ['buildings-list', userProject], queryFn: () => apiClient.get('/buildings', { params: { limit: 50, project: userProject || undefined } }).then(r => r.data) });
  const { data: floorsData }    = useQuery({ queryKey: ['floors-list', form.building],  queryFn: () => apiClient.get('/floors',    { params: { limit: 50, building: form.building || undefined } }).then(r => r.data), enabled: !!form.building });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/maintenance', body).then(r => r.data),
    onSuccess: (res) => navigate(`/maintenance/${res.data._id}`),
  });

  function f(k: keyof MRForm, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Wrench className="h-6 w-6 text-indigo-500" />{t('maintenance.new')}
      </h1>

      <form className="card p-6 space-y-4" onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, project: userProject || undefined, floor: form.floor || undefined, building: form.building || undefined }); }}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('maintenance.requestTitle')} *</label>
          <input className="input w-full" value={form.title} onChange={e => f('title', e.target.value)} required placeholder={t('maintenance.titlePlaceholder')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')} / {t('maintenance.description')} *</label>
          <textarea className="input w-full" rows={3} value={form.description} onChange={e => f('description', e.target.value)} required placeholder={t('maintenance.descPlaceholder')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')}</label>
            <select className="input w-full" value={form.building} onChange={e => { f('building', e.target.value); f('floor', ''); }}>
              <option value="">—</option>
              {(buildingsData?.data || []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.floor')}</label>
            <select className="input w-full" value={form.floor} onChange={e => f('floor', e.target.value)} disabled={!form.building}>
              <option value="">{t('common.select')}</option>
              {(floorsData?.data || []).map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('maintenance.category')} *</label>
            <select className="input w-full" value={form.category} onChange={e => f('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`maintenance.categories.${c}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.priority')}</label>
            <select className="input w-full" value={form.priority} onChange={e => f('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{t(`status.${p}`)}</option>)}
            </select>
          </div>
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
