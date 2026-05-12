import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare, User, CheckCircle2, Truck, X, Play, CalendarDays, Package, ChevronRight, MapPin } from 'lucide-react';
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
      apiClient.post(url, body || {}).then(() => {
        qc.invalidateQueries({ queryKey: ['client-request', id] });
        qc.invalidateQueries({ queryKey: ['client-requests'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      }),
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
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('common.back')}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-400">{t('clientRequests.title')}</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-700 font-medium truncate max-w-[220px]">{cr.title}</span>
      </div>

      {/* Page Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="p-2 rounded-lg bg-indigo-500">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">{cr.title}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_COLORS[cr.requestType]}`}>
                {t(`clientRequests.types.${cr.requestType}`)}
              </span>
              <StatusBadge status={cr.priority} />
              <StatusBadge status={cr.status} />
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-slate-400 font-medium">{t('common.createdAt')}</p>
            <p className="text-sm font-semibold text-slate-700">{format(new Date(cr.createdAt), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('clientRequests.requestedBy')}</p>
          </div>
          <p className="font-semibold text-slate-800">{(cr.requestedBy as any)?.fullName || '—'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-indigo-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('common.assignedTo')}</p>
          </div>
          <p className="font-semibold text-slate-800">
            {(cr.assignedTo as any)?.fullName || <span className="text-slate-400 font-normal">{t('maintenance.unassigned')}</span>}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('common.dueDate')}</p>
          </div>
          <p className="font-semibold text-slate-800">
            {cr.expectedDelivery ? format(new Date(cr.expectedDelivery), 'dd MMM yyyy') : '—'}
          </p>
          {cr.deliveredAt && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              ✓ {t('clientRequests.deliveredOn')}: {format(new Date(cr.deliveredAt), 'dd MMM yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Location Info */}
      {((cr.floor as any)?.name || cr.room || cr.locationNotes) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('common.floor')} / {t('common.room')}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            {(cr.floor as any)?.name && (
              <span><span className="text-slate-400 text-xs">{t('common.floor')}: </span>{(cr.floor as any).name}</span>
            )}
            {cr.room && (
              <span><span className="text-slate-400 text-xs">{t('common.room')}: </span>{cr.room}</span>
            )}
            {cr.locationNotes && (
              <span className="italic text-slate-500">{cr.locationNotes}</span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('maintenance.description')}</h2>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{cr.description}</p>
        {cr.notes && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">{t('common.notes')}</p>
            <p className="text-sm text-slate-500 italic">{cr.notes}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      {cr.items && cr.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">{t('clientRequests.requestedItems')}</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{cr.items.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[t('common.name'), t('common.quantity'), t('common.unit')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cr.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/70 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 text-slate-400">{item.unit || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Reason */}
      {cr.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <X className="h-4 w-4 text-red-500" />
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">{t('clientRequests.rejectionReason')}</p>
          </div>
          <p className="text-sm text-red-600">{cr.rejectionReason}</p>
        </div>
      )}

      {/* Actions Panel */}
      {(canManage || isClient) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('maintenance.actions')}</h2>

          {canManage && cr.status === 'submitted' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('common.assignedTo')}</label>
                <select className="input w-full" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {users.map((u: any) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
              <button className="btn-primary" disabled={!assigneeId || actionMutation.isPending}
                onClick={() => act('/assign', { assignedTo: assigneeId })}>
                <User className="h-4 w-4" />{t('maintenance.assign')}
              </button>
            </div>
          )}

          {canManage && cr.status === 'assigned' && (
            <button className="btn-primary" disabled={actionMutation.isPending}
              onClick={() => act('/start')}>
              <Play className="h-4 w-4" />{t('clientRequests.startFulfillment')}
            </button>
          )}

          {canManage && cr.status === 'in_progress' && (
            <button className="btn-primary" disabled={actionMutation.isPending}
              onClick={() => act('/deliver')}>
              <Truck className="h-4 w-4" />{t('clientRequests.markDelivered')}
            </button>
          )}

          {isClient && cr.status === 'delivered' && (
            <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" disabled={actionMutation.isPending}
              onClick={() => act('/confirm')}>
              <CheckCircle2 className="h-4 w-4" />{t('clientRequests.confirmDelivery')}
            </button>
          )}

          {canManage && !['confirmed','rejected'].includes(cr.status) && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-500">{t('clientRequests.rejectReason')}</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder={t('clientRequests.rejectPlaceholder')} />
                <button className="btn-secondary text-red-600 hover:text-red-700 hover:border-red-300"
                  disabled={actionMutation.isPending}
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
