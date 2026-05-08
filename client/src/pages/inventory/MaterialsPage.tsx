import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { InventoryBalance } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { downloadExport } from '../../utils/downloadExport';
import toast from 'react-hot-toast';

export function MaterialsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const { data, isLoading } = useQuery({
    queryKey: ['materials-inventory', page, period],
    queryFn: () => apiClient.get('/inventory/materials', { params: { page, limit: 25, period } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.materialsWarehouse')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('common.monthlyBalanceTracking')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className="input w-40" value={period} onChange={e => setPeriod(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => downloadExport(`/export/materials-inventory/pdf?period=${period}`, `Mirsad_Materials_Inventory_${period}.pdf`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
              <Download className="h-4 w-4" /> PDF
            </button>
            <button onClick={() => downloadExport(`/export/inventory/excel?type=material&period=${period}`, `Mirsad_Materials_Inventory_${period}.xlsx`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.name'), t('common.category'), t('common.unit'), t('common.limit'), t('inventory.opening'), t('inventory.received'), t('inventory.issued'), t('inventory.damaged'), t('inventory.remainingQty'), t('common.status')].map(h => (
              <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((b: InventoryBalance) => {
              const item = b.item as any;
              return (
                <tr key={b._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/inventory/materials/${b._id}`)}>
                  <td className="px-3 py-3 font-medium text-slate-900">{item?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{item?.category?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{item?.unit || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{b.monthlyLimit}</td>
                  <td className="px-3 py-3">{b.openingBalance}</td>
                  <td className="px-3 py-3 text-green-600">{b.receivedQty}</td>
                  <td className="px-3 py-3 text-orange-600">{b.issuedQty}</td>
                  <td className="px-3 py-3 text-red-500">{b.damagedQty}</td>
                  <td className={`px-3 py-3 font-medium ${b.remainingQty <= 0 ? 'text-red-600' : b.status === 'low_stock' ? 'text-amber-600' : 'text-slate-900'}`}>{b.remainingQty}</td>
                  <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
