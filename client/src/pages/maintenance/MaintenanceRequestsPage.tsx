import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Wrench, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import apiClient from '../../api/client';
import { MaintenanceRequest } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

const PRIORITY_RING: Record<string, string> = {
  critical: 'border-s-4 border-s-red-600',
  high:     'border-s-4 border-s-orange-500',
  medium:   'border-s-4 border-s-amber-400',
  low:      'border-s-4 border-s-slate-300',
};

const CATEGORY_ICON: Record<string, string> = {
  electrical: '⚡', plumbing: '🚿', hvac: '❄️',
  equipment: '⚙️', cleaning: '🧹', structural: '🏗️', other: '🔧',
};

export function MaintenanceRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: mrData, isLoading } = useQuery({
    queryKey: ['maintenance', page, statusFilter, priorityFilter],
    queryFn: () => apiClient.get('/maintenance', { params: { page, limit: 20, status: statusFilter || undefined, priority: priorityFilter || undefined } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const requests: MaintenanceRequest[] = mrData?.data || [];

  const counts = {
    open:        requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    critical:    requests.filter(r => r.priority === 'critical').length,
    resolved:    requests.filter(r => ['resolved','closed'].includes(r.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-indigo-500" />
            {t('maintenance.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('maintenance.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/maintenance/new')} className="btn-primary flex items-center gap-2">
          <Wrench className="h-4 w-4" />{t('maintenance.new')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('status.open'),        value: counts.open,        color: 'bg-amber-50  border-amber-200  text-amber-700'  },
          { label: t('status.in_progress'), value: counts.in_progress, color: 'bg-blue-50   border-blue-200   text-blue-700'   },
          { label: t('status.critical'),    value: counts.critical,    color: 'bg-red-50    border-red-200    text-red-700'    },
          { label: t('status.resolved'),    value: counts.resolved,    color: 'bg-green-50  border-green-200  text-green-700'  },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          {['open','assigned','in_progress','resolved','closed'].map(s => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select className="input w-36" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">{t('common.all')} {t('common.priority')}</option>
          {['critical','high','medium','low'].map(p => (
            <option key={p} value={p}>{t(`status.${p}`)}</option>
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
            onClick={() => navigate(`/maintenance/${req._id}`)}
            className={clsx('card p-4 cursor-pointer hover:shadow-md transition-shadow', PRIORITY_RING[req.priority])}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{CATEGORY_ICON[req.category] || '🔧'}</span>
                  <h3 className="font-semibold text-slate-900 truncate">{req.title}</h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{req.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                  {(req.building as any)?.name && <span>{(req.building as any).name}</span>}
                  {(req.floor as any)?.name    && <span>· {(req.floor as any).name}</span>}
                  <span>· {t(`maintenance.categories.${req.category}`)}</span>
                  {(req.reportedBy as any)?.fullName && <span>· {t('maintenance.reportedBy')}: {(req.reportedBy as any).fullName}</span>}
                  <span>· {format(new Date(req.createdAt), 'dd MMM')}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={req.priority} />
                <StatusBadge status={req.status} />
                {(req.assignedTo as any)?.fullName && (
                  <span className="text-xs text-slate-400">{(req.assignedTo as any).fullName}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mrData?.pagination && <Pagination pagination={mrData.pagination} onPageChange={setPage} />}
    </div>
  );
}
