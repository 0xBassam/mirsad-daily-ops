import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Wrench, User, MapPin, CheckCircle2, Play, X } from 'lucide-react';
import apiClient from '../../api/client';
import { MaintenanceRequest } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORY_ICON: Record<string, string> = {
  electrical: '⚡', plumbing: '🚿', hvac: '❄️',
  equipment: '⚙️', cleaning: '🧹', structural: '🏗️', other: '🔧',
};

export function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [resolution, setResolution] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => apiClient.get(`/maintenance/${id}`).then(r => r.data.data as MaintenanceRequest),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => apiClient.get('/users', { params: { limit: 50 } }).then(r => r.data),
  });

  function mutate(url: string, body?: object) {
    return apiClient.post(url, body || {}).then(() => qc.invalidateQueries({ queryKey: ['maintenance', id] }));
  }

  const actionMutation = useMutation({ mutationFn: (p: { url: string; body?: object }) => mutate(p.url, p.body) });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="p-6 text-slate-500">{t('common.notFound')}</p>;

  const mr = data;
  const users = usersData?.data || [];
  const canManage = user && ['admin', 'project_manager', 'assistant_supervisor'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm">
          <ArrowLeft className="h-4 w-4" />{t('common.back')}
        </button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">{CATEGORY_ICON[mr.category] || '🔧'}</span>
            {mr.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{format(new Date(mr.createdAt), 'dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={mr.priority} />
          <StatusBadge status={mr.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('maintenance.reportedBy')}</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{(mr.reportedBy as any)?.fullName || '—'}</span>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('common.assignedTo')}</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{(mr.assignedTo as any)?.fullName || t('maintenance.unassigned')}</span>
          </div>
          {mr.assignedAt && <p className="text-xs text-slate-400 mt-1">{format(new Date(mr.assignedAt), 'dd MMM yyyy')}</p>}
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('maintenance.location')}</p>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{(mr.building as any)?.name}{(mr.floor as any)?.name ? ` — ${(mr.floor as any).name}` : ''}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t(`maintenance.categories.${mr.category}`)}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">{t('maintenance.description')}</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{mr.description}</p>
        {mr.notes && <p className="mt-3 text-sm text-slate-500 italic">{mr.notes}</p>}
      </div>

      {mr.resolution && (
        <div className="card p-5 border-green-200 bg-green-50">
          <h2 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />{t('maintenance.resolution')}
          </h2>
          <p className="text-sm text-green-700">{mr.resolution}</p>
          {mr.resolvedAt && <p className="text-xs text-green-500 mt-1">{format(new Date(mr.resolvedAt), 'dd MMM yyyy')}</p>}
        </div>
      )}

      {canManage && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">{t('maintenance.actions')}</h2>

          {mr.status === 'open' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-slate-500 mb-1">{t('common.assignedTo')}</label>
                <select className="input w-full" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {users.map((u: any) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
              <button
                className="btn-primary flex items-center gap-2"
                disabled={!assigneeId || actionMutation.isPending}
                onClick={() => actionMutation.mutate({ url: `/maintenance/${id}/assign`, body: { assignedTo: assigneeId } })}
              >
                <User className="h-4 w-4" />{t('maintenance.assign')}
              </button>
            </div>
          )}

          {mr.status === 'assigned' && (
            <button
              className="btn-primary flex items-center gap-2"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ url: `/maintenance/${id}/start` })}
            >
              <Play className="h-4 w-4" />{t('maintenance.startWork')}
            </button>
          )}

          {['assigned','in_progress'].includes(mr.status) && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-500">{t('maintenance.resolutionNotes')} *</label>
              <textarea className="input w-full" rows={2} value={resolution} onChange={e => setResolution(e.target.value)} placeholder={t('maintenance.resolutionPlaceholder')} />
              <button
                className="btn-primary flex items-center gap-2"
                disabled={!resolution.trim() || actionMutation.isPending}
                onClick={() => actionMutation.mutate({ url: `/maintenance/${id}/resolve`, body: { resolution } })}
              >
                <CheckCircle2 className="h-4 w-4" />{t('maintenance.markResolved')}
              </button>
            </div>
          )}

          {mr.status === 'resolved' && (
            <button
              className="btn-secondary flex items-center gap-2"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ url: `/maintenance/${id}/close` })}
            >
              <X className="h-4 w-4" />{t('maintenance.close')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
