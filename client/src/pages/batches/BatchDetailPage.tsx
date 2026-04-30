import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import { Batch } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { differenceInDays, parseISO } from 'date-fns';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['batches', id],
    queryFn: () => apiClient.get(`/batches/${id}`).then(r => r.data),
  });

  const batch: Batch | undefined = data?.data;

  if (isLoading) return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  if (!batch) return <div className="p-8 text-center text-slate-500">{t('common.noData')}</div>;

  const daysUntilExpiry = differenceInDays(parseISO(batch.expiryDate), new Date());
  const usedPct = Math.round(((batch.quantity - batch.remainingQty) / batch.quantity) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{batch.batchNumber}</h1>
          <p className="text-sm text-slate-500">{batch.item.name}</p>
        </div>
        <div className="ms-auto"><StatusBadge status={batch.status} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Batch Information</h3>
          <InfoRow label="Item" value={batch.item.name} />
          <InfoRow label={t('common.supplier')} value={batch.supplier.name} />
          <InfoRow label={t('common.project')} value={batch.project.name} />
          <InfoRow label="Storage Zone" value={<StatusBadge status={batch.storageZone} />} />
          <InfoRow label={t('common.receivedDate')} value={new Date(batch.receivedDate).toLocaleDateString()} />
          {batch.notes && <InfoRow label={t('common.notes')} value={batch.notes} />}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Quantity & Expiry</h3>
          <InfoRow label="Original Quantity" value={`${batch.quantity} ${batch.item.unit}`} />
          <InfoRow label="Remaining" value={`${batch.remainingQty} ${batch.item.unit}`} />
          <InfoRow label={t('common.expiryDate')} value={
            <span className={daysUntilExpiry < 0 ? 'text-red-600 font-medium' : daysUntilExpiry <= 7 ? 'text-amber-600 font-medium' : 'text-green-600'}>
              {new Date(batch.expiryDate).toLocaleDateString()} ({daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)}d expired` : `${daysUntilExpiry}d left`})
            </span>
          } />

          {/* Usage bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Consumed</span>
              <span>{usedPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
