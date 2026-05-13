import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Download, ShieldOff } from 'lucide-react';
import apiClient from '../../api/client';
import { InventoryBalance, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { downloadExport } from '../../utils/downloadExport';
import toast from 'react-hot-toast';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const ALLOWED_ROLES: UserRole[] = ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'warehouse', 'kitchen', 'operations'];

export function FoodInventoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const [period, setPeriod] = useState(currentPeriod);

  const isAllowed = user ? ALLOWED_ROLES.includes(user.role as UserRole) : false;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['food-inventory', page, period],
    queryFn: () => apiClient.get('/inventory/food', { params: { page, limit: 25, period } }).then(r => r.data),
    enabled: isAllowed,
  });

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">{t('common.accessDenied')}</h2>
        <p className="text-sm text-slate-400 max-w-sm">{t('common.accessDeniedDesc')}</p>
        <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;

  if (isError) {
    const status = (error as any)?.response?.status;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">
          {status === 403 ? t('common.accessDenied') : t('common.loadError')}
        </h2>
        <p className="text-sm text-slate-400">{status === 403 ? t('common.accessDeniedDesc') : `HTTP ${status ?? 'unknown'}`}</p>
        <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
      </div>
    );
  }

  const balances: InventoryBalance[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.foodInventory')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('common.monthlyBalanceTracking')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="month" className="input w-40" value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} />
          {!IS_DEMO && (
            <div className="flex gap-2">
              <button onClick={() => downloadExport(`/export/food-inventory/pdf?period=${period}`, `Mirsad_Food_Inventory_${period}.pdf`).catch(() => toast.error(t('common.loadError')))} className="btn-secondary flex items-center gap-1.5">
                <Download className="h-4 w-4" /> PDF
              </button>
              <button onClick={() => downloadExport(`/export/inventory/excel?type=food&period=${period}`, `Mirsad_Food_Inventory_${period}.xlsx`).catch(() => toast.error(t('common.loadError')))} className="btn-secondary flex items-center gap-1.5">
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Flow legend */}
      <div className="card p-3 bg-indigo-50 border-indigo-100 text-xs text-indigo-700 flex flex-wrap gap-3 items-center">
        <span className="font-semibold">{t('inventory.flowLabel')}:</span>
        <span>{t('inventory.opening')} + {t('inventory.received')} − {t('inventory.consumed')} − {t('inventory.issued')} − {t('inventory.damaged')} + {t('inventory.returned')} = {t('inventory.remainingQty')}</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  t('common.name'), t('common.category'), t('common.unit'),
                  t('common.limit'), t('inventory.opening'),
                  t('inventory.received'), t('inventory.consumed'),
                  t('inventory.issued'), t('inventory.damaged'),
                  t('inventory.remainingQty'), t('common.status'),
                ].map((h, i) => (
                  <th key={i} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-sm text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : balances.map((b: InventoryBalance) => {
                const item = b.item as any;
                return (
                  <tr key={b._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/inventory/food/${b._id}`)}>
                    <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">{item?.name || '—'}</td>
                    <td className="px-3 py-3 text-slate-500">{item?.category?.name || '—'}</td>
                    <td className="px-3 py-3 text-slate-500">{item?.unit || '—'}</td>
                    <td className="px-3 py-3 text-slate-500">{b.monthlyLimit}</td>
                    <td className="px-3 py-3 text-slate-600">{b.openingBalance}</td>
                    <td className="px-3 py-3 text-green-700 font-medium">{b.receivedQty}</td>
                    <td className="px-3 py-3 text-orange-600">{b.consumedQty}</td>
                    <td className="px-3 py-3 text-blue-600">{(b as any).issuedQty ?? 0}</td>
                    <td className="px-3 py-3 text-red-500">{(b as any).damagedQty ?? 0}</td>
                    <td className={`px-3 py-3 font-semibold ${b.remainingQty <= 0 ? 'text-red-600' : b.status === 'low_stock' ? 'text-amber-600' : 'text-slate-900'}`}>
                      {b.remainingQty}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
