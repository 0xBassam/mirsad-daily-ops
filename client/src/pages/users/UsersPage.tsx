import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { User } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ROLE_LABELS } from '../../utils/roleHelpers';
import { formatDate } from '../../utils/formatDate';
import { Plus, Pencil, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'client'];

export function UsersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'supervisor', status: 'active' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiClient.get('/users', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiClient.post('/users', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t('common.create')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: any) => apiClient.put(`/users/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t('common.update')); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t('common.save')); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function openCreate() {
    setEditing(null);
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'supervisor', status: 'active' });
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ fullName: u.fullName, email: u.email, password: '', phone: u.phone || '', role: u.role, status: u.status });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const body: any = { ...form };
      if (!body.password) delete body.password;
      updateMutation.mutate({ id: editing._id, body });
    } else {
      createMutation.mutate(form);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('users.title')}</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t('common.addUser')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.name'), t('common.email'), t('common.role'), t('common.status'), t('common.createdAt'), t('common.actions')].map(h => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((u: User) => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3"><Badge variant="indigo">{ROLE_LABELS[u.role]}</Badge></td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {u.status === 'active' && (
                      <button onClick={() => disableMutation.mutate(u._id)} className="text-slate-400 hover:text-red-600 transition-colors">
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `${t('common.edit')} ${t('users.title')}` : t('common.addUser')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.fullName')}</label>
              <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.phone')}</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.email')}</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.password')} {editing && <span className="text-slate-400 font-normal">{t('common.keepBlank')}</span>}</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.role')}</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.status')}</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
