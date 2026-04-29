import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['movements'] }); toast.success('Movement recorded'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Stock Movements</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Record Movement</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Date', 'Item', 'Type', 'Qty', 'Project', 'Source', 'Notes', 'By'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Stock Movement" size="lg">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
              <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
                <option value="">Select project</option>
                {projects?.data?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
              <select className="input" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required>
                <option value="">Select item</option>
                {items?.data?.map((it: any) => <option key={it._id} value={it._id}>{it.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Movement Type</label>
              <select className="input" value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })}>
                {MOVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" min="1" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} required />
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" className="input" value={form.movementDate} onChange={e => setForm({ ...form, movementDate: e.target.value })} required />
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
