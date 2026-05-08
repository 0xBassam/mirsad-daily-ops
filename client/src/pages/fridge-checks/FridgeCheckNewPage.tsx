import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thermometer, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';

const STORAGE_ZONES = ['cold', 'chilled', 'freezer', 'ambient', 'dry_storage', 'coffee_station', 'hospitality'] as const;
const CONDITIONS = ['good', 'damaged', 'expired', 'near_expiry'] as const;

interface CheckItem {
  batch: string;
  item: string;
  expiryDate: string;
  quantity: number;
  condition: string;
  nameTagPresent: boolean;
  notes: string;
}

interface FridgeForm {
  project: string; building: string; floor: string;
  storageZone: string;
  temperature: string;
  expectedTempMin: string;
  expectedTempMax: string;
  cleanlinessOk: boolean;
  cleanlinessNotes: string;
  date: string;
}

const today = new Date().toISOString().split('T')[0];
const EMPTY: FridgeForm = {
  project: '', building: '', floor: '', storageZone: 'cold',
  temperature: '', expectedTempMin: '1', expectedTempMax: '5',
  cleanlinessOk: true, cleanlinessNotes: '', date: today,
};

export function FridgeCheckNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FridgeForm>(EMPTY);
  const [items, setItems] = useState<CheckItem[]>([]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings-list', form.project],
    queryFn: () => apiClient.get('/buildings', { params: { limit: 50, project: form.project } }).then(r => r.data),
    enabled: !!form.project,
  });
  const { data: floorsData } = useQuery({
    queryKey: ['floors-list', form.building],
    queryFn: () => apiClient.get('/floors', { params: { limit: 50, building: form.building } }).then(r => r.data),
    enabled: !!form.building,
  });
  const { data: batchesData } = useQuery({
    queryKey: ['batches-active', form.project],
    queryFn: () => apiClient.get('/batches', { params: { limit: 100, project: form.project, status: 'active' } }).then(r => r.data),
    enabled: !!form.project,
  });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/fridge-checks', body).then(r => r.data),
    onSuccess: (res) => navigate(`/fridge-checks/${res.data._id}`),
  });

  function f(k: keyof FridgeForm, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function addItem() {
    setItems(p => [...p, { batch: '', item: '', expiryDate: '', quantity: 0, condition: 'good', nameTagPresent: true, notes: '' }]);
  }

  function removeItem(i: number) {
    setItems(p => p.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, k: keyof CheckItem, v: string | number | boolean) {
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  }

  function onBatchSelect(i: number, batchId: string) {
    const batch = (batchesData?.data || []).find((b: any) => b._id === batchId);
    if (batch) {
      updateItem(i, 'batch', batchId);
      updateItem(i, 'item', batch.item?._id || batch.item);
      updateItem(i, 'expiryDate', batch.expiryDate ? batch.expiryDate.split('T')[0] : '');
      updateItem(i, 'quantity', batch.remainingQty || 0);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      temperature: parseFloat(form.temperature),
      expectedTempMin: parseFloat(form.expectedTempMin),
      expectedTempMax: parseFloat(form.expectedTempMax),
      itemsChecked: items.map(it => ({ ...it, quantity: Number(it.quantity) })),
      building: form.building || undefined,
      floor: form.floor || undefined,
    });
  }

  const batches: any[] = batchesData?.data || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Thermometer className="h-6 w-6 text-indigo-500" />
        {t('fridgeChecks.newCheck')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">{t('common.location')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')} *</label>
              <select className="input w-full" value={form.project} onChange={e => f('project', e.target.value)} required>
                <option value="">{t('common.selectProject')}</option>
                {(projectsData?.data || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.building')} *</label>
              <select className="input w-full" value={form.building} onChange={e => f('building', e.target.value)} required disabled={!form.project}>
                <option value="">{t('common.selectBuilding')}</option>
                {(buildingsData?.data || []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.floor')} *</label>
              <select className="input w-full" value={form.floor} onChange={e => f('floor', e.target.value)} required disabled={!form.building}>
                <option value="">{t('common.select')}</option>
                {(floorsData?.data || []).map((fl: any) => <option key={fl._id} value={fl._id}>{fl.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fridgeChecks.storageZone')} *</label>
              <select className="input w-full" value={form.storageZone} onChange={e => f('storageZone', e.target.value)}>
                {STORAGE_ZONES.map(z => <option key={z} value={z}>{z.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')} *</label>
              <input type="date" className="input w-full" value={form.date} onChange={e => f('date', e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Temperature + Cleanliness */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">{t('common.temperature')} &amp; {t('common.cleanliness')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fridgeChecks.actualTemp')} (°C) *</label>
              <input type="number" step="0.1" className="input w-full" value={form.temperature} onChange={e => f('temperature', e.target.value)} required placeholder="e.g. 3.2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fridgeChecks.minTemp')} (°C)</label>
              <input type="number" step="0.1" className="input w-full" value={form.expectedTempMin} onChange={e => f('expectedTempMin', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fridgeChecks.maxTemp')} (°C)</label>
              <input type="number" step="0.1" className="input w-full" value={form.expectedTempMax} onChange={e => f('expectedTempMax', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="cleanlinessOk" checked={form.cleanlinessOk} onChange={e => f('cleanlinessOk', e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            <label htmlFor="cleanlinessOk" className="text-sm font-medium text-slate-700">{t('fridgeChecks.cleanlinessOk')}</label>
          </div>
          {!form.cleanlinessOk && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('fridgeChecks.cleanlinessNotes')}</label>
              <textarea className="input w-full" rows={2} value={form.cleanlinessNotes} onChange={e => f('cleanlinessNotes', e.target.value)} placeholder={t('fridgeChecks.cleanlinessNotesPlaceholder')} />
            </div>
          )}
        </div>

        {/* Items Checked */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">{t('fridgeChecks.itemsChecked')} ({items.length})</h3>
            <button type="button" className="btn-secondary flex items-center gap-1.5 text-sm" onClick={addItem} disabled={!form.project}>
              <Plus className="h-4 w-4" /> {t('common.addItem')}
            </button>
          </div>
          {items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">{t('fridgeChecks.noItemsAdded')}</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{t('common.item')} #{i + 1}</span>
                <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Batch *</label>
                  <select className="input w-full text-sm" value={item.batch} onChange={e => onBatchSelect(i, e.target.value)} required>
                    <option value="">{t('common.select')}</option>
                    {batches.map((b: any) => (
                      <option key={b._id} value={b._id}>{b.batchNumber} — {b.item?.name || b.item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.quantity')}</label>
                  <input type="number" min={0} className="input w-full text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.condition')}</label>
                  <select className="input w-full text-sm" value={item.condition} onChange={e => updateItem(i, 'condition', e.target.value)}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id={`tag-${i}`} checked={item.nameTagPresent} onChange={e => updateItem(i, 'nameTagPresent', e.target.checked)} className="h-4 w-4 accent-indigo-600" />
                  <label htmlFor={`tag-${i}`} className="text-sm text-slate-600">{t('fridgeChecks.nameTagPresent')}</label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('fridgeChecks.submitCheck')}
          </button>
        </div>
      </form>
    </div>
  );
}
