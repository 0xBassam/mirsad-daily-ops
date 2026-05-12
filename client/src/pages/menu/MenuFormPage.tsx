import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { UtensilsCrossed, Plus, X, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'coffee_break';

interface MenuForm {
  date:      string;
  project:   string;
  mealType:  MealType;
  notes:     string;
  items:     { name: string; quantity: string; unit: string; notes: string }[];
}

const EMPTY: MenuForm = {
  date:     format(new Date(), 'yyyy-MM-dd'),
  project:  '',
  mealType: 'breakfast',
  notes:    '',
  items:    [],
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'coffee_break'];

export function MenuFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<MenuForm>(EMPTY);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => apiClient.get(`/menu/${id}`).then(r => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        date:     format(new Date(existing.date), 'yyyy-MM-dd'),
        project:  typeof existing.project === 'object' ? existing.project._id : existing.project,
        mealType: existing.mealType,
        notes:    existing.notes ?? '',
        items:    (existing.items ?? []).map((it: any) => ({
          name:     it.name,
          quantity: String(it.quantity),
          unit:     it.unit ?? '',
          notes:    it.notes ?? '',
        })),
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (body: object) =>
      isEdit
        ? apiClient.put(`/menu/${id}`, body).then(r => r.data)
        : apiClient.post('/menu', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success(t('common.save'));
      navigate('/menu');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function f(k: keyof MenuForm, v: any) { setForm(p => ({ ...p, [k]: v })); }
  function addItem() { setForm(p => ({ ...p, items: [...p.items, { name: '', quantity: '1', unit: '', notes: '' }] })); }
  function removeItem(i: number) { setForm(p => ({ ...p, items: p.items.filter((_, j) => j !== i) })); }
  function updateItem(i: number, k: string, v: string) {
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project) { toast.error(t('common.selectProject')); return; }
    mutation.mutate({
      date:     form.date,
      project:  form.project,
      mealType: form.mealType,
      notes:    form.notes,
      items: form.items.map(it => ({
        name:     it.name,
        quantity: Number(it.quantity),
        unit:     it.unit || undefined,
        notes:    it.notes || undefined,
      })),
    });
  }

  if (isEdit && loadingExisting) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/menu" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500">
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEdit ? t('menu.editMenu') : t('menu.newMenu')}
          </h1>
        </div>
      </div>

      <form className="card p-6 space-y-5" onSubmit={handleSubmit}>
        {/* Date + Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t('common.date')} *</label>
            <input type="date" className="input w-full" value={form.date} onChange={e => f('date', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t('common.project')} *</label>
            <select className="input w-full" value={form.project} onChange={e => f('project', e.target.value)} required>
              <option value="">{t('common.selectProject')}</option>
              {(projectsData?.data ?? []).map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Meal type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t('menu.mealType')} *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MEAL_TYPES.map(mt => (
              <button
                key={mt}
                type="button"
                onClick={() => f('mealType', mt)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  form.mealType === mt
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >
                {t(`menu.mealTypes.${mt}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">{t('menu.menuItems')}</label>
            <button type="button" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium" onClick={addItem}>
              <Plus className="h-3.5 w-3.5" /> {t('menu.addItem')}
            </button>
          </div>

          {form.items.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm">{t('menu.noItemsYet')}</p>
              <button type="button" className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium" onClick={addItem}>
                + {t('menu.addItem')}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-xl p-2">
                <input
                  className="input flex-1 min-w-0"
                  placeholder={t('common.name')}
                  value={item.name}
                  onChange={e => updateItem(i, 'name', e.target.value)}
                  required
                />
                <input
                  type="number" min="0" step="0.1"
                  className="input w-20"
                  placeholder={t('common.quantity')}
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  required
                />
                <input
                  className="input w-20"
                  placeholder={t('common.unit')}
                  value={item.unit}
                  onChange={e => updateItem(i, 'unit', e.target.value)}
                />
                <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">{t('common.notes')}</label>
          <textarea className="input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder={t('menu.notesPlaceholder')} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Link to="/menu" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
