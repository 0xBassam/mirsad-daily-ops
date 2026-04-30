import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';
import { CorrectiveAction } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';
import { differenceInDays, parseISO } from 'date-fns';

const PRIORITY_RING: Record<string, string> = {
  critical: 'border-s-4 border-s-red-600',
  high: 'border-s-4 border-s-orange-500',
  medium: 'border-s-4 border-s-amber-400',
  low: 'border-s-4 border-s-slate-300',
};

export function CorrectiveActionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['corrective-actions', status, priority],
    queryFn: () => apiClient.get('/corrective-actions', { params: { ...(status && { status }), ...(priority && { priority }) } }).then(r => r.data),
  });

  const actions: CorrectiveAction[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-indigo-500" />
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.correctiveActions')}</h1>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input w-auto" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">{t('common.all')} {t('common.priority')}</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
      ) : actions.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">{t('common.noData')}</div>
      ) : (
        <div className="space-y-3">
          {actions.map(action => {
            const daysOverdue = differenceInDays(new Date(), parseISO(action.dueDate));
            return (
              <div
                key={action._id}
                className={clsx('card p-4 flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow', PRIORITY_RING[action.priority])}
                onClick={() => navigate(`/corrective-actions/${action._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{action.title}</span>
                    <StatusBadge status={action.priority} />
                    <StatusBadge status={action.status} />
                  </div>
                  <p className="text-sm text-slate-500 mb-2 line-clamp-2">{action.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{t('common.assignedTo')}: <strong className="text-slate-700">{action.assignedTo.fullName}</strong></span>
                    <span>{t('common.dueDate')}: <strong className={clsx(daysOverdue > 0 && action.status !== 'resolved' ? 'text-red-600' : 'text-slate-700')}>
                      {new Date(action.dueDate).toLocaleDateString()}
                      {daysOverdue > 0 && action.status !== 'resolved' && ` (${daysOverdue}d overdue)`}
                    </strong></span>
                    <span>Source: {action.sourceType}</span>
                  </div>
                </div>
                <Eye className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
