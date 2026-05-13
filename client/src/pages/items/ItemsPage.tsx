import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Item } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export function ItemsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', category: '', type: 'food', unit: 'pcs', limitQty: 0, status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, typeFilter],
    queryFn: () => apiClient.get('/items', { params: { page, limit: 25, ...(typeFilter && { type: typeFilter }) } }).then(r => r.data),
  });
  const { data: categories } = useQuery({ queryKey: ['categories-all'], queryFn: () => apiClient.get('/categories', { params: { limit: 100 } }).then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? apiClient.put(`/items/${editing._id}`, body) : apiClient.post('/items', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); toast.success(t('common.save')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openEdit(item?: Item) {
    setEditing(item || null);
    setForm(item ? {
      name: item.name,
      category: typeof item.category === 'object' ? item.category._id : item.category,
      type: item.type,
      unit: item.unit,
      limitQty: item.limitQty,
      status: item.status,
    } : { name: '', category: '', type: 'food', unit: 'pcs', limitQty: 0, status: 'active' });
    setShowModal(true);
  }

  if (isLoading) return <PageLoader />;

  const typeFilters = [
    { value: '', label: t('common.all') },
    { value: 'food', label: t('status.food') },
    { value: 'material', label: t('status.material') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.itemsMaster')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('nav.itemsMasterSubtitle')}</p>
        </div>
        <button onClick={() => openEdit()} className="btn-primary"><Plus className="h-4 w-4" /> {t('common.addItem')}</button>
      </div>
      <div className="flex gap-2">
        {typeFilters.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.name'), t('common.category'), t('common.type'), t('common.unit'), t('common.limit'), t('common.status'), ''].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((item: Item) => (
              <tr key={item._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3 text-slate-500">{typeof item.category === 'object' ? item.category.name : '-'}</td>
                <td className="px-4 py-3"><Badge variant={item.type === 'food' ? 'green' : 'blue'}>{item.type === 'food' ? t('status.food') : t('status.material')}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                <td className="px-4 py-3 text-slate-500">{item.limitQty}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('common.editItem') : t('common.addItem')} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate({ ...form, limitQty: Number(form.limitQty) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')}</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.type')}</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="food">{t('status.food')}</option><option value="material">{t('status.material')}</option>
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.category')}</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
              <option value="">{t('common.selectCategory')}</option>
              {categories?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.unit')}</label><input className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.monthlyLimit')}</label><input type="number" className="input" value={form.limitQty} onChange={e => setForm({ ...form, limitQty: +e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
