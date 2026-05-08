import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Project } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatDate';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', clientName: '', locationCode: '', status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => apiClient.get('/projects', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? apiClient.put(`/projects/${editing._id}`, body) : apiClient.post('/projects', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success(editing ? t('common.update') : t('common.create')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openEdit(e: React.MouseEvent, p?: Project) {
    e.stopPropagation();
    setEditing(p || null);
    setForm(p ? { name: p.name, clientName: p.clientName || '', locationCode: p.locationCode || '', status: p.status } : { name: '', clientName: '', locationCode: '', status: 'active' });
    setShowModal(true);
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.title')}</h1>
        <button onClick={e => openEdit(e)} className="btn-primary"><Plus className="h-4 w-4" /> {t('common.addProject')}</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.name'), t('projects.clientName'), t('common.locationCode'), t('common.status'), t('common.createdAt'), ''].map(h => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((p: Project) => (
              <tr key={p._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/projects/${p._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.clientName || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.locationCode || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={e => openEdit(e, p)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `${t('common.edit')} ${t('projects.title')}` : t('common.addProject')}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')}</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.clientName')}</label><input className="input" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('common.locationCode')}</label><input className="input" value={form.locationCode} onChange={e => setForm({ ...form, locationCode: e.target.value })} /></div>
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
