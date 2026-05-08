import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MessageSquare, Plus, Clock, Play, Truck, CheckCircle2, User, CalendarDays, Package } from 'lucide-react';
import { clsx } from 'clsx';
import apiClient from '../../api/client';
import { ClientRequest } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

const PRIORITY_RING: Record<string, string> = {
  urgent: 'border-s-4 border-s-red-500',
  high:   'border-s-4 border-s-orange-500',
  medium: 'border-s-4 border-s-amber-400',
  low:    'border-s-4 border-s-slate-300',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-amber-400',
  low:    'bg-slate-300',
};

const TYPE_COLORS: Record<string, string> = {
  catering:     'bg-orange-100 text-orange-700',
  maintenance:  'bg-slate-100 text-slate-700',
  supplies:     'bg-blue-100 text-blue-700',
  event:        'bg-purple-100 text-purple-700',
  housekeeping: 'bg-teal-100 text-teal-700',
  other:        'bg-gray-100 text-gray-600',
};

export function ClientRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: crData, isLoading } = useQuery({
    queryKey: ['client-requests', page, statusFilter, typeFilter],
    queryFn: () => apiClient.get('/client-requests', { params: { page, limit: 20, status: statusFilter || undefined, requestType: typeFilter || undefined } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const requests: ClientRequest[] = crData?.data || [];

  const statusCounts = {
    submitted:   requests.filter(r => r.status === 'submitted').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    delivered:   requests.filter(r => r.status === 'delivered').length,
    confirmed:   requests.filter(r => r.status === 'confirmed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-500" />
            {t('clientRequests.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('clientRequests.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/client-requests/new')} className="btn-primary">
          <Plus className="h-4 w-4" />{t('clientRequests.new')}
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('status.submitted'),   value: statusCounts.submitted,   Icon: Clock,        bg: 'bg-amber-500',   color: 'text-amber-600',   border: 'border-amber-200',   light: 'bg-amber-50' },
          { label: t('status.in_progress'), value: statusCounts.in_progress, Icon: Play,         bg: 'bg-blue-500',    color: 'text-blue-600',    border: 'border-blue-200',    light: 'bg-blue-50' },
          { label: t('status.delivered'),   value: statusCounts.delivered,   Icon: Truck,        bg: 'bg-violet-500',  color: 'text-violet-600',  border: 'border-violet-200',  light: 'bg-violet-50' },
          { label: t('status.confirmed'),   value: statusCounts.confirmed,   Icon: CheckCircle2, bg: 'bg-emerald-500', color: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
        ].map(c => (
          <div key={c.label} className={`${c.light} border ${c.border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`p-2.5 rounded-xl ${c.bg} flex-shrink-0`}>
              <c.Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className={`text-2xl font-extrabold tabular-nums ${c.color}`}>{c.value}</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filter</span>
        <select className="input w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          {['submitted','assigned','in_progress','delivered','confirmed','rejected'].map(s => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select className="input w-40" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">{t('clientRequests.allTypes')}</option>
          {['catering','maintenance','supplies','event','housekeeping','other'].map(t2 => (
            <option key={t2} value={t2}>{t(`clientRequests.types.${t2}`)}</option>
          ))}
        </select>
        {(statusFilter || typeFilter) && (
          <button
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => { setStatusFilter(''); setTypeFilter(''); setPage(1); }}
          >
            Clear
          </button>
        )}
        <span className="ms-auto text-xs text-slate-400 font-medium">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Request Cards */}
      <div className="space-y-2.5">
        {requests.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <MessageSquare className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">{t('common.noData')}</p>
          </div>
        )}
        {requests.map(req => (
          <div
            key={req._id}
            onClick={() => navigate(`/client-requests/${req._id}`)}
            className={clsx(
              'bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all',
              PRIORITY_RING[req.priority],
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_COLORS[req.requestType]}`}>
                    {t(`clientRequests.types.${req.requestType}`)}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{req.title}</h3>
                </div>
                {req.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{req.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {(req.requestedBy as any)?.fullName || '—'}
                  </span>
                  {req.expectedDelivery && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Due {format(new Date(req.expectedDelivery), 'dd MMM')}
                    </span>
                  )}
                  {req.items?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {req.items.length} {t('clientRequests.items')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(req.createdAt), 'dd MMM')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <StatusBadge status={req.status} />
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${PRIORITY_DOT[req.priority] ?? 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-500 capitalize">{req.priority}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {crData?.pagination && <Pagination pagination={crData.pagination} onPageChange={setPage} />}
    </div>
  );
}
