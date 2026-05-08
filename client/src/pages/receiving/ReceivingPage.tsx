import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Truck, Package } from 'lucide-react';
import apiClient from '../../api/client';
import { Receiving } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

export function ReceivingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: receivingData, isLoading } = useQuery({
    queryKey: ['receivings', page, statusFilter],
    queryFn: () => apiClient.get('/receiving', { params: { page, limit: 20, status: statusFilter || undefined } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const records: Receiving[] = receivingData?.data || [];

  const counts = {
    pending:   records.filter(r => r.status === 'pending').length,
    confirmed: records.filter(r => r.status === 'confirmed').length,
    partial:   records.filter(r => r.status === 'partial').length,
    rejected:  records.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('receiving.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('receiving.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('status.pending'),   value: counts.pending,   color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: t('status.confirmed'), value: counts.confirmed, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: t('status.partial'),   value: counts.partial,   color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: t('status.rejected'),  value: counts.rejected,  color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select className="input w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          {['pending', 'confirmed', 'partial', 'rejected'].map(s => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.date'), t('common.supplier'), t('receiving.poRef'), t('receiving.items'), t('common.status'), t('common.recordedBy')].map(h => (
                <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
            ) : records.map((rec) => (
              <tr key={rec._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/receiving/${rec._id}`)}>
                <td className="px-3 py-3 text-slate-400 text-xs">{format(new Date(rec.deliveryDate), 'dd MMM yyyy')}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900">{(rec.supplier as any)?.name || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-500 text-xs font-mono">{(rec.purchaseOrder as any)?.poNumber || '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    {rec.lines.length} {t('receiving.lines')}
                  </div>
                </td>
                <td className="px-3 py-3"><StatusBadge status={rec.status} /></td>
                <td className="px-3 py-3 text-slate-500 text-xs">{(rec.receivedBy as any)?.fullName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {receivingData?.pagination && <Pagination pagination={receivingData.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
