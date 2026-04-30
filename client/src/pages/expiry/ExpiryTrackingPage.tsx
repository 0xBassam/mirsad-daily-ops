import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { Batch } from '../../types';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { differenceInDays, parseISO } from 'date-fns';
import { clsx } from 'clsx';

const TABS = ['expired', 'today', '3days', '7days'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  expired: 'Expired',
  today: 'Today',
  '3days': '≤ 3 Days',
  '7days': '≤ 7 Days',
};

export function ExpiryTrackingPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('3days');

  const { data, isLoading } = useQuery({
    queryKey: ['expiry-tracking', tab],
    queryFn: () => apiClient.get('/expiry-tracking', { params: { window: tab } }).then(r => r.data),
  });

  const batches: Batch[] = data?.data || [];

  function daysLeft(expiryDate: string) {
    return differenceInDays(parseISO(expiryDate), new Date());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.expiryTracking')}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Clock className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            No batches in this window
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.batchNumber')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Item</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Zone</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Remaining</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.expiryDate')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map(b => {
                const days = daysLeft(b.expiryDate);
                const expired = days < 0;
                return (
                  <tr key={b._id} className={clsx('hover:bg-slate-50', expired ? 'bg-red-50' : days <= 3 ? 'bg-amber-50' : '')}>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{b.batchNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{b.item.name}</div>
                      <div className="text-xs text-slate-500">{b.supplier.name}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.storageZone} /></td>
                    <td className="px-4 py-3 text-slate-700">{b.remainingQty} {b.item.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(b.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {expired
                        ? <Badge variant="red">{Math.abs(days)}d ago</Badge>
                        : days === 0
                        ? <Badge variant="red">Today</Badge>
                        : days <= 3
                        ? <Badge variant="red">{days}d</Badge>
                        : <Badge variant="yellow">{days}d</Badge>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
