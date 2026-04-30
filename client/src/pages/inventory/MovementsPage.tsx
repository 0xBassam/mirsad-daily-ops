import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { StockMovement } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatDate';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MOVEMENT_TYPES = ['RECEIVE', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'CONSUMPTION'];
const MOVEMENT_COLORS: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray'> = {
  RECEIVE: 'green', RETURN: 'green', TRANSFER_IN: 'blue',
  ISSUE: 'red', CONSUMPTION: 'red', DAMAGE: 'red', TRANSFER_OUT: 'yellow', ADJUSTMENT: 'gray',
};

export function MovementsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ project: '', item: '', movementType: 'RECEIVE', quantity: 1, movementDate: new Date().toISOString().split('T')[0], notes: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => apiClient.get(`/inventory/movements?page=${page}&limit=25`).then(r => r.data),
  });

  const { data: projects } = useQuery({ queryKey: ['projects-all'], queryFn: () => apiClient.get('/projects?limit=100').then(r => r.data) });
  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => apiClient.get('/items?limit=200&status=active').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiClient.post('/inventory/movements', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['movements'] }); toast.success(t('common.save')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.stockMovements')}</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> {t('common.recordMovement')}</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.date'), t('common.name'), t('common.type'), t('common.quantity'), t('common.project'), t('movements.sourceType'), t('common.notes'), t('common.createdBy')].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((m: StockMovement) => {
              const item = typeof m.item === 'object' ? m.item : null;
              return (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.movementDate)}</td>
                  <td className="px-4 py-3 font-medium">{item?.name || '—'} <span className="text-xs text-slate-400">({item?.unit})</span></td>
                  <td className="px-4 py-3"><Badge variant={MOVEMENT_COLORS[m.movementType] || 'gray'}>{m.movementType}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-500">{typeof m.project === 'object' ? m.project.name : '-'}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{m.sourceType}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.notes || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.createdBy?.fullName || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('common.recordMovement')} size="lg">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')}</label>
              <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
                <option value="">{t('common.selectProject')}</option>
                {projects?.data?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')}</label>
              <select className="input" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required>
                <option value="">{t('common.selectItem')}</option>
                {items?.data?.map((it: any) => <option key={it._id} value={it._id}>{it.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.movementType')}</label>
              <select className="input" value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })}>
                {MOVEMENT_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.quantity')}</label>
              <input type="number" min="1" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} required />
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')}</label>
              <input type="date" className="input" value={form.movementDate} onChange={e => setForm({ ...form, movementDate: e.target.value })} required />
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{t('common.record')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
