import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Building } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export function BuildingsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ name: '', project: '', status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['buildings', page], queryFn: () => apiClient.get('/buildings', { params: { page, limit: 20 } }).then(r => r.data) });
  const { data: projects } = useQuery({ queryKey: ['projects-all'], queryFn: () => apiClient.get('/projects', { params: { limit: 100 } }).then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? apiClient.put(`/buildings/${editing._id}`, body) : apiClient.post('/buildings', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buildings'] }); toast.success(t('common.save')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openEdit(b?: Building) {
    setEditing(b || null);
    const proj = b?.project ? (typeof b.project === 'object' ? b.project._id : b.project) : '';
    setForm(b ? { name: b.name, project: proj, status: b.status } : { name: '', project: '', status: 'active' });
    setShowModal(true);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.buildings')}</h1>
        <button onClick={() => openEdit()} className="btn-primary"><Plus className="h-4 w-4" /> {t('common.addBuilding')}</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.name'), t('common.project'), t('common.status'), ''].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((b: Building) => (
              <tr key={b._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-3 text-slate-500">{typeof b.project === 'object' ? b.project.name : b.project}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3"><button onClick={() => openEdit(b)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `${t('common.edit')} ${t('nav.buildings')}` : t('common.addBuilding')}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')}</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')}</label>
            <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
              <option value="">{t('common.selectProject')}</option>
              {projects?.data?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.status')}</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('common.active')}</option><option value="inactive">{t('common.inactive')}</option>
            </select>
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
