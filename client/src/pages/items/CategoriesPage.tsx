import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { ItemCategory } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ItemCategory | null>(null);
  const [form, setForm] = useState({ name: '', type: 'food', status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['categories', page], queryFn: () => apiClient.get(`/categories?page=${page}&limit=30`).then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? apiClient.put(`/categories/${editing._id}`, body) : apiClient.post('/categories', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Saved'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openEdit(c?: ItemCategory) {
    setEditing(c || null);
    setForm(c ? { name: c.name, type: c.type, status: c.status } : { name: '', type: 'food', status: 'active' });
    setShowModal(true);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Item Categories</h1>
        <button onClick={() => openEdit()} className="btn-primary"><Plus className="h-4 w-4" /> Add Category</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Name', 'Type', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((c: ItemCategory) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3"><Badge variant={c.type === 'food' ? 'green' : 'blue'}>{c.type === 'food' ? 'Food' : 'Material'}</Badge></td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><button onClick={() => openEdit(c)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="food">Food</option><option value="material">Material</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
