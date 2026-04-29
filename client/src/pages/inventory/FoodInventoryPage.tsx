import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { InventoryBalance } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

export function FoodInventoryPage() {
  const [page, setPage] = useState(1);
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const [period, setPeriod] = useState(currentPeriod);

  const { data, isLoading } = useQuery({
    queryKey: ['food-inventory', page, period],
    queryFn: () => apiClient.get(`/inventory/food?page=${page}&limit=25&period=${period}`).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Food Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Monthly balance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className="input w-40" value={period} onChange={e => setPeriod(e.target.value)} />
          <a href={`/api/reports/inventory/food/excel?period=${period}`} target="_blank" rel="noreferrer" className="btn-secondary">
            <Download className="h-4 w-4" /> Export
          </a>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Item', 'Category', 'Unit', 'Limit', 'Opening', 'Received', 'Consumed', 'Remaining', 'Status'].map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((b: InventoryBalance) => {
              const item = b.item as any;
              return (
                <tr key={b._id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-900">{item?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{item?.category?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{item?.unit || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{b.monthlyLimit}</td>
                  <td className="px-3 py-3">{b.openingBalance}</td>
                  <td className="px-3 py-3 text-green-600">{b.receivedQty}</td>
                  <td className="px-3 py-3 text-orange-600">{b.consumedQty}</td>
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
