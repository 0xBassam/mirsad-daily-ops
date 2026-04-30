import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { SpoilageAlert } from '../../types';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const PRIORITY_COLOR: Record<string, string> = {
  expired: 'border-s-red-500',
  near_expiry: 'border-s-amber-400',
  temperature_breach: 'border-s-orange-500',
  damaged: 'border-s-red-400',
  spoiled: 'border-s-red-600',
};

export function SpoilageAlertsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [status, setStatus] = useState('active');

  const { data, isLoading } = useQuery({
    queryKey: ['spoilage-alerts', status],
    queryFn: () => apiClient.get('/spoilage-alerts', { params: status ? { status } : {} }).then(r => r.data),
  });

  const alerts: SpoilageAlert[] = data?.data || [];

  async function handleResolve(id: string) {
    try {
      await apiClient.put(`/spoilage-alerts/${id}/resolve`);
      toast.success('Alert resolved');
      qc.invalidateQueries({ queryKey: ['spoilage-alerts'] });
    } catch {
      toast.error('Failed to resolve alert');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.spoilageAlerts')}</h1>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t('common.all')}</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
      ) : alerts.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-400" />
          No alerts in this category
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert._id}
              className={clsx('card p-4 border-s-4 flex items-start justify-between gap-4', PRIORITY_COLOR[alert.alertType] || 'border-s-slate-300')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-900">{alert.item.name}</span>
                  <StatusBadge status={alert.alertType} />
                  <StatusBadge status={alert.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Batch: <span className="font-mono">{alert.batch.batchNumber}</span></span>
                  <span>Zone: <StatusBadge status={alert.storageZone} /></span>
                  <span>Qty: {alert.quantity} {alert.item.unit}</span>
                  {alert.daysUntilExpiry !== undefined && (
                    <span>Days until expiry: <strong className={alert.daysUntilExpiry <= 0 ? 'text-red-600' : 'text-amber-600'}>{alert.daysUntilExpiry}</strong></span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Detected: {new Date(alert.detectedAt).toLocaleString()}
                </div>
              </div>
              {alert.status === 'active' && (
                <button
                  onClick={() => handleResolve(alert._id)}
                  className="flex-shrink-0 btn-secondary text-xs py-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('common.resolve')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
