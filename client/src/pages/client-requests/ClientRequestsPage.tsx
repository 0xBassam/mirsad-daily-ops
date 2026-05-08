import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MessageSquare, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import apiClient from '../../api/client';
import { ClientRequest } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

const PRIORITY_RING: Record<string, string> = {
  urgent: 'border-s-4 border-s-red-600',
  high:   'border-s-4 border-s-orange-500',
  medium: 'border-s-4 border-s-amber-400',
  low:    'border-s-4 border-s-slate-300',
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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-500" />
            {t('clientRequests.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('clientRequests.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/client-requests/new')} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />{t('clientRequests.new')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('status.submitted'),   value: statusCounts.submitted,   color: 'bg-amber-50  border-amber-200  text-amber-700'  },
          { label: t('status.in_progress'), value: statusCounts.in_progress, color: 'bg-blue-50   border-blue-200   text-blue-700'   },
          { label: t('status.delivered'),   value: statusCounts.delivered,   color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: t('status.confirmed'),   value: statusCounts.confirmed,   color: 'bg-green-50  border-green-200  text-green-700'  },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
      </div>

      <div className="space-y-2">
        {requests.length === 0 && (
          <div className="card p-8 text-center text-slate-400">{t('common.noData')}</div>
        )}
        {requests.map(req => (
          <div
            key={req._id}
            onClick={() => navigate(`/client-requests/${req._id}`)}
            className={clsx('card p-4 cursor-pointer hover:shadow-md transition-shadow', PRIORITY_RING[req.priority])}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[req.requestType]}`}>
                    {t(`clientRequests.types.${req.requestType}`)}
                  </span>
                  <h3 className="font-semibold text-slate-900 truncate">{req.title}</h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{req.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                  <span>{(req.requestedBy as any)?.fullName}</span>
                  {req.expectedDelivery && <span>· {t('common.dueDate')}: {format(new Date(req.expectedDelivery), 'dd MMM')}</span>}
                  {req.items?.length > 0 && <span>· {req.items.length} {t('clientRequests.items')}</span>}
                  <span>· {format(new Date(req.createdAt), 'dd MMM')}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={req.priority} />
                <StatusBadge status={req.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {crData?.pagination && <Pagination pagination={crData.pagination} onPageChange={setPage} />}
    </div>
  );
}
