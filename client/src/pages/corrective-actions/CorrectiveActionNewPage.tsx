import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';

const SOURCE_TYPES = ['fridge_check', 'floor_check', 'inventory', 'manual'] as const;
const PRIORITIES   = ['low', 'medium', 'high', 'critical'] as const;

interface CAForm {
  title: string; description: string;
  sourceType: string; project: string;
  assignedTo: string; dueDate: string; priority: string;
}

const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 3);
const EMPTY: CAForm = {
  title: '', description: '', sourceType: 'manual', project: '',
  assignedTo: '', dueDate: tomorrow.toISOString().split('T')[0], priority: 'medium',
};

export function CorrectiveActionNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<CAForm>(EMPTY);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => apiClient.get('/users', { params: { limit: 100 } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/corrective-actions', body).then(r => r.data),
    onSuccess: (res) => navigate(`/corrective-actions/${res.data._id}`),
  });

  function f(k: keyof CAForm, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-indigo-500" />
        {t('correctiveActions.new')}
      </h1>

      <form
        className="card p-6 space-y-4"
        onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('correctiveActions.title')} *</label>
          <input className="input w-full" value={form.title} onChange={e => f('title', e.target.value)} required placeholder={t('correctiveActions.titlePlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.description')} *</label>
          <textarea className="input w-full" rows={3} value={form.description} onChange={e => f('description', e.target.value)} required placeholder={t('correctiveActions.descPlaceholder')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
            <select className="input w-full" value={form.project} onChange={e => f('project', e.target.value)} required>
              <option value="">{t('common.selectProject')}</option>
              {(projectsData?.data || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('correctiveActions.sourceType')} *</label>
            <select className="input w-full" value={form.sourceType} onChange={e => f('sourceType', e.target.value)}>
              {SOURCE_TYPES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.assignedTo')} *</label>
            <select className="input w-full" value={form.assignedTo} onChange={e => f('assignedTo', e.target.value)} required>
              <option value="">{t('common.select')}</option>
              {(usersData?.data || []).map((u: any) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.dueDate')} *</label>
            <input type="date" className="input w-full" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} required />
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
