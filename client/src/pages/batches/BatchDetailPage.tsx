import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import { Batch } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { differenceInDays, parseISO, format } from 'date-fns';
import { clsx } from 'clsx';

const MOVEMENT_COLORS: Record<string, string> = {
  RECEIVE:      'text-green-600 bg-green-50',
  ISSUE:        'text-red-600 bg-red-50',
  TRANSFER_IN:  'text-blue-600 bg-blue-50',
  TRANSFER_OUT: 'text-orange-600 bg-orange-50',
  ADJUSTMENT:   'text-purple-600 bg-purple-50',
  DAMAGE:       'text-red-700 bg-red-100',
  RETURN:       'text-teal-600 bg-teal-50',
  CONSUMPTION:  'text-amber-600 bg-amber-50',
};

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

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements-by-item', batch?.item?._id],
    queryFn: () => apiClient.get('/inventory/movements', { params: { item: batch!.item._id, limit: 20 } }).then(r => r.data),
    enabled: !!batch?.item?._id,
  });

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

      {/* Stock Movements */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Stock Movements — {batch.item.name}</h3>
        </div>
        {movementsLoading ? (
          <div className="p-6 text-center text-slate-400">{t('common.loading')}</div>
        ) : (movementsData?.data || []).length === 0 ? (
          <div className="p-6 text-center text-slate-400">{t('common.noData')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Date', 'Type', 'Qty', 'Source', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-start text-xs font-medium text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(movementsData?.data || []).map((mv: any) => (
                <tr key={mv._id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-500">{format(new Date(mv.movementDate), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', MOVEMENT_COLORS[mv.movementType] || 'text-slate-600 bg-slate-100')}>
                      {mv.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{mv.quantity} {batch.item.unit}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{mv.sourceType}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{mv.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
