import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare, User, CheckCircle2, Truck, X, Play } from 'lucide-react';
import apiClient from '../../api/client';
import { ClientRequest } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const TYPE_COLORS: Record<string, string> = {
  catering:     'bg-orange-100 text-orange-700',
  maintenance:  'bg-slate-100  text-slate-700',
  supplies:     'bg-blue-100   text-blue-700',
  event:        'bg-purple-100 text-purple-700',
  housekeeping: 'bg-teal-100   text-teal-700',
  other:        'bg-gray-100   text-gray-600',
};

export function ClientRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [assigneeId, setAssigneeId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['client-request', id],
    queryFn: () => apiClient.get(`/client-requests/${id}`).then(r => r.data.data as ClientRequest),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => apiClient.get('/users', { params: { limit: 50 } }).then(r => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ url, body }: { url: string; body?: object }) =>
      apiClient.post(url, body || {}).then(() => qc.invalidateQueries({ queryKey: ['client-request', id] })),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="p-6 text-slate-500">{t('common.notFound')}</p>;

  const cr = data;
  const users = usersData?.data || [];
  const canManage = user && ['admin', 'project_manager', 'assistant_supervisor', 'supervisor'].includes(user.role);
  const isClient  = user?.role === 'client';

  function act(url: string, body?: object) {
    actionMutation.mutate({ url: `/client-requests/${id}${url}`, body });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm">
          <ArrowLeft className="h-4 w-4" />{t('common.back')}
        </button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-slate-900">{cr.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cr.requestType]}`}>
              {t(`clientRequests.types.${cr.requestType}`)}
            </span>
            <StatusBadge status={cr.priority} />
            <StatusBadge status={cr.status} />
          </div>
        </div>
        <p className="text-sm text-slate-400">{format(new Date(cr.createdAt), 'dd MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('clientRequests.requestedBy')}</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{(cr.requestedBy as any)?.fullName || '—'}</span>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('common.assignedTo')}</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{(cr.assignedTo as any)?.fullName || t('maintenance.unassigned')}</span>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('common.dueDate')}</p>
          <p className="text-sm font-medium">{cr.expectedDelivery ? format(new Date(cr.expectedDelivery), 'dd MMM yyyy') : '—'}</p>
          {cr.deliveredAt && <p className="text-xs text-green-600 mt-1">{t('clientRequests.deliveredOn')}: {format(new Date(cr.deliveredAt), 'dd MMM yyyy')}</p>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">{t('maintenance.description')}</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{cr.description}</p>
        {cr.notes && <p className="mt-3 text-sm text-slate-500 italic">{cr.notes}</p>}
      </div>

      {cr.items && cr.items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-800 text-sm">{t('clientRequests.requestedItems')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[t('common.name'), t('common.quantity'), t('common.unit')].map(h => (
                  <th key={h} className="px-3 py-2 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cr.items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                  <td className="px-3 py-2 text-slate-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-slate-400">{item.unit || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cr.rejectionReason && (
        <div className="card p-4 border-red-200 bg-red-50">
          <p className="text-xs font-semibold text-red-700 mb-1">{t('clientRequests.rejectionReason')}</p>
          <p className="text-sm text-red-600">{cr.rejectionReason}</p>
        </div>
      )}

      {(canManage || isClient) && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">{t('maintenance.actions')}</h2>

          {canManage && cr.status === 'submitted' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-slate-500 mb-1">{t('common.assignedTo')}</label>
                <select className="input w-full" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {users.map((u: any) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
              <button className="btn-primary flex items-center gap-2" disabled={!assigneeId || actionMutation.isPending}
                onClick={() => act('/assign', { assignedTo: assigneeId })}>
                <User className="h-4 w-4" />{t('maintenance.assign')}
              </button>
            </div>
          )}

          {canManage && cr.status === 'assigned' && (
            <button className="btn-primary flex items-center gap-2" disabled={actionMutation.isPending}
              onClick={() => act('/start')}>
              <Play className="h-4 w-4" />{t('clientRequests.startFulfillment')}
            </button>
          )}

          {canManage && cr.status === 'in_progress' && (
            <button className="btn-primary flex items-center gap-2" disabled={actionMutation.isPending}
              onClick={() => act('/deliver')}>
              <Truck className="h-4 w-4" />{t('clientRequests.markDelivered')}
            </button>
          )}

          {isClient && cr.status === 'delivered' && (
            <div className="flex gap-3">
              <button className="btn-primary flex items-center gap-2" disabled={actionMutation.isPending}
                onClick={() => act('/confirm')}>
                <CheckCircle2 className="h-4 w-4" />{t('clientRequests.confirmDelivery')}
              </button>
            </div>
          )}

          {canManage && !['confirmed','rejected'].includes(cr.status) && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs text-slate-500">{t('clientRequests.rejectReason')}</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t('clientRequests.rejectPlaceholder')} />
                <button className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700" disabled={actionMutation.isPending}
                  onClick={() => act('/reject', { rejectionReason: rejectReason })}>
                  <X className="h-4 w-4" />{t('common.reject')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
