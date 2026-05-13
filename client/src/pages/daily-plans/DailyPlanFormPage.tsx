import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface PlanLine { floor: string; item: string; plannedQty: number; notes: string; }

export function DailyPlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const userProject = (user as any)?.project;
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], building: '', shift: 'morning', status: 'draft', notes: '' });
  const [lines, setLines] = useState<PlanLine[]>([{ floor: '', item: '', plannedQty: 10, notes: '' }]);
  const [initialized, setInitialized] = useState(false);

  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['daily-plan', id],
    queryFn: () => apiClient.get(`/daily-plans/${id}`).then(r => r.data.data),
    enabled: isEdit,
  });

  if (isEdit && planData && !initialized) {
    setForm({
      date: planData.date?.split('T')[0] || '',
      building: typeof planData.building === 'object' ? planData.building._id : planData.building,
      shift: planData.shift,
      status: planData.status,
      notes: planData.notes || '',
    });
    if (planData.lines?.length) {
      setLines(planData.lines.map((l: any) => ({
        floor: typeof l.floor === 'object' ? l.floor._id : l.floor,
        item: typeof l.item === 'object' ? l.item._id : l.item,
        plannedQty: l.plannedQty,
        notes: l.notes || '',
      })));
    }
    setInitialized(true);
  }

  const { data: buildings } = useQuery({ queryKey: ['buildings-all', userProject], queryFn: () => apiClient.get('/buildings', { params: { limit: 100, project: userProject || undefined } }).then(r => r.data) });
  const { data: floors } = useQuery({ queryKey: ['floors-all'], queryFn: () => apiClient.get('/floors', { params: { limit: 100, status: 'active' } }).then(r => r.data) });
  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => apiClient.get('/items', { params: { limit: 200, status: 'active' } }).then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => isEdit ? apiClient.put(`/daily-plans/${id}`, body) : apiClient.post('/daily-plans', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-plans'] }); toast.success(t('common.save')); navigate('/daily-plans'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isEdit && planLoading) return <PageLoader />;

  function addLine() { setLines([...lines, { floor: '', item: '', plannedQty: 10, notes: '' }]); }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, key: keyof PlanLine, val: string | number) {
    const updated = [...lines];
    (updated[i] as any)[key] = val;
    setLines(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ ...form, project: userProject || undefined, lines });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/daily-plans" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? `${t('common.edit')} ${t('dailyPlans.title')}` : t('dailyPlans.new')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t('dailyPlans.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')}</label>
              <select className="input" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} required>
                <option value="">{t('common.selectBuilding')}</option>
                {buildings?.data?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.shift')}</label>
              <select className="input" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                {['morning', 'afternoon', 'evening', 'night'].map(s => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.status')}</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['draft', 'published', 'closed'].map(s => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">{t('dailyPlans.lines')} ({lines.length})</h2>
            <button type="button" onClick={addLine} className="btn-secondary text-xs">
              <Plus className="h-3.5 w-3.5" /> {t('common.add')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-start py-2 px-2 text-xs text-slate-500 uppercase">{t('common.floor')}</th>
                  <th className="text-start py-2 px-2 text-xs text-slate-500 uppercase">{t('common.name')}</th>
                  <th className="text-start py-2 px-2 text-xs text-slate-500 uppercase">{t('dailyPlans.plannedQty')}</th>
                  <th className="text-start py-2 px-2 text-xs text-slate-500 uppercase">{t('common.notes')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-2">
                      <select className="input text-xs" value={line.floor} onChange={e => updateLine(i, 'floor', e.target.value)} required>
                        <option value="">{t('common.floor')}</option>
                        {floors?.data?.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select className="input text-xs" value={line.item} onChange={e => updateLine(i, 'item', e.target.value)} required>
                        <option value="">{t('common.name')}</option>
                        {items?.data?.map((it: any) => <option key={it._id} value={it._id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min="0" className="input text-xs w-24" value={line.plannedQty} onChange={e => updateLine(i, 'plannedQty', +e.target.value)} />
                    </td>
                    <td className="py-2 px-2">
                      <input className="input text-xs" value={line.notes} onChange={e => updateLine(i, 'notes', e.target.value)} placeholder={t('common.notes')} />
                    </td>
                    <td className="py-2 px-2">
                      <button type="button" onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/daily-plans" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{t('common.save')}</button>
        </div>
      </form>
    </div>
  );
}
