import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Floor } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export function FloorsPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState({ name: '', building: '', project: '', locationCode: '', status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['floors', page], queryFn: () => apiClient.get(`/floors?page=${page}&limit=50`).then(r => r.data) });
  const { data: buildings } = useQuery({ queryKey: ['buildings-all'], queryFn: () => apiClient.get('/buildings?limit=100').then(r => r.data) });
  const { data: projects } = useQuery({ queryKey: ['projects-all'], queryFn: () => apiClient.get('/projects?limit=100').then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? apiClient.put(`/floors/${editing._id}`, body) : apiClient.post('/floors', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floors'] }); toast.success('Saved'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openEdit(f?: Floor) {
    setEditing(f || null);
    setForm(f ? {
      name: f.name,
      building: typeof f.building === 'object' ? f.building._id : f.building,
      project: typeof f.project === 'object' ? f.project._id : f.project,
      locationCode: f.locationCode || '',
      status: f.status,
    } : { name: '', building: '', project: '', locationCode: '', status: 'active' });
    setShowModal(true);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Floors</h1>
        <button onClick={() => openEdit()} className="btn-primary"><Plus className="h-4 w-4" /> Add Floor</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Name', 'Building', 'Project', 'Location Code', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((f: Floor) => (
              <tr key={f._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                <td className="px-4 py-3 text-slate-500">{typeof f.building === 'object' ? f.building.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{typeof f.project === 'object' ? f.project.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{f.locationCode || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3"><button onClick={() => openEdit(f)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Floor' : 'Add Floor'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Floor Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
              <option value="">Select project</option>
              {projects?.data?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
            <select className="input" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} required>
              <option value="">Select building</option>
              {buildings?.data?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Location Code</label><input className="input" value={form.locationCode} onChange={e => setForm({ ...form, locationCode: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
