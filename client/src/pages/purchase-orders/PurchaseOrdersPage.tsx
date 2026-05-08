import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, FileText } from 'lucide-react';
import apiClient from '../../api/client';
import { PurchaseOrder, POStatus } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

const STATUS_OPTIONS: POStatus[] = ['active', 'partially_received', 'fully_received', 'near_depletion', 'over_consumed', 'closed'];

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [month, setMonth] = useState(currentMonth);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, status, month],
    queryFn: () => apiClient.get('/purchase-orders', { params: { page, limit: 20, ...(status && { status }), ...(month && { month }) } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const orders: PurchaseOrder[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('purchaseOrders.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('purchaseOrders.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/purchase-orders/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> {t('purchaseOrders.new')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          className="input w-40"
          value={month}
          onChange={e => { setMonth(e.target.value); setPage(1); }}
        />
        <select className="input w-48" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('purchaseOrders.poNumber'), t('common.supplier'), t('common.project'), t('purchaseOrders.month'), t('purchaseOrders.lines'), t('common.status'), t('common.createdAt')].map(h => (
                <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
            ) : orders.map(po => {
              const supplier = po.supplier as any;
              const project  = po.project as any;
              return (
                <tr
                  key={po._id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/purchase-orders/${po._id}`)}
                >
                  <td className="px-3 py-3 font-mono text-sm font-medium text-indigo-700">{po.poNumber}</td>
                  <td className="px-3 py-3 text-slate-700">{supplier?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{project?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{po.month}</td>
                  <td className="px-3 py-3 text-slate-500">{po.lines?.length ?? 0} {t('purchaseOrders.items')}</td>
                  <td className="px-3 py-3"><StatusBadge status={po.status} /></td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{format(new Date(po.createdAt), 'dd MMM yyyy')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>

      {/* Summary cards */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['active', 'near_depletion', 'over_consumed', 'fully_received'] as POStatus[]).map(s => {
            const count = orders.filter(o => o.status === s).length;
            const colors: Record<string, string> = {
              active: 'border-blue-400 bg-blue-50 text-blue-700',
              near_depletion: 'border-amber-400 bg-amber-50 text-amber-700',
              over_consumed: 'border-red-400 bg-red-50 text-red-700',
              fully_received: 'border-green-400 bg-green-50 text-green-700',
            };
            return (
              <div key={s} className={`kpi-card border-s-4 ${colors[s]}`}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">{t(`status.${s}`)}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
