import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star } from 'lucide-react';
import apiClient from '../../api/client';
import { Supplier, Batch } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';
import { differenceInDays, parseISO } from 'date-fns';

type Tab = 'info' | 'batches';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={clsx('h-4 w-4', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
      ))}
      <span className="ms-1 text-sm text-slate-500 font-medium">{rating}/5</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value || '—'}</span>
    </div>
  );
}

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('info');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => apiClient.get(`/suppliers/${id}`).then(r => r.data),
  });

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['supplier-batches', id],
    queryFn: () => apiClient.get('/batches', { params: { supplier: id, limit: 20 } }).then(r => r.data),
    enabled: tab === 'batches' && !!id,
  });

  const supplier: Supplier | undefined = data?.data;
  const batches: Batch[] = batchesData?.data || [];

  if (isLoading) return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  if (!supplier) return <div className="p-8 text-center text-slate-500">{t('common.noData')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{supplier.name}</h1>
          {supplier.nameAr && <p className="text-sm text-slate-500">{supplier.nameAr}</p>}
        </div>
        <div className="ms-auto"><StatusBadge status={supplier.status} /></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['info', 'batches'] as Tab[]).map(t2 => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={clsx('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize', tab === t2 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700')}
          >
            {t2 === 'info' ? t('common.details') : t('nav.batches')}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('common.details')}</h3>
            <InfoRow label={t('common.category')} value={<StatusBadge status={supplier.category} />} />
            <InfoRow label={t('common.phone')} value={supplier.phone} />
            <InfoRow label={t('common.email')} value={supplier.email} />
            <InfoRow label={t('common.address')} value={supplier.address} />
            <InfoRow label="License" value={supplier.licenseNumber} />
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('common.rating')}</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Overall Rating</p>
                <StarRating rating={supplier.rating} />
              </div>
              <InfoRow label="Contact Name" value={supplier.contactName} />
              <InfoRow label={t('common.createdAt')} value={new Date(supplier.createdAt).toLocaleDateString()} />
            </div>
          </div>
        </div>
      )}

      {tab === 'batches' && (
        <div className="card overflow-hidden">
          {batchesLoading ? (
            <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-slate-400">{t('common.noData')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Batch #', t('common.item'), t('common.receivedDate'), t('common.expiryDate'), 'Qty', 'Remaining', 'Zone', t('common.status')].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(batch => {
                  const daysLeft = differenceInDays(parseISO(batch.expiryDate), new Date());
                  return (
                    <tr key={batch._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/batches/${batch._id}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600">{batch.batchNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{batch.item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(batch.receivedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-sm', daysLeft < 0 ? 'text-red-600 font-medium' : daysLeft <= 7 ? 'text-amber-600 font-medium' : 'text-slate-600')}>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                          {daysLeft < 0 && <span className="text-xs ms-1">(exp)</span>}
                          {daysLeft >= 0 && daysLeft <= 7 && <span className="text-xs ms-1">({daysLeft}d)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{batch.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{batch.remainingQty}</td>
                      <td className="px-4 py-3"><StatusBadge status={batch.storageZone} /></td>
                      <td className="px-4 py-3"><StatusBadge status={batch.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
