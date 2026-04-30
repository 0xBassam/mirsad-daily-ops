import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { InventoryBalance } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { ArrowLeft } from 'lucide-react';
import { MOVEMENTS } from '../../mocks/data';

export function InventoryItemDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const isFood = location.pathname.includes('/inventory/food/');
  const backPath = isFood ? '/inventory/food' : '/inventory/materials';

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-item', id, isFood],
    queryFn: () => apiClient.get(`/inventory/${isFood ? 'food' : 'materials'}/${id}`).then(r => r.data.data),
  });

  if (isLoading || !data) return <PageLoader />;

  const balance = data as InventoryBalance;
  const item = balance.item as any;

  const total = balance.openingBalance + balance.receivedQty;
  const segments = [
    { label: t('inventory.opening'), value: balance.openingBalance, color: 'bg-slate-400' },
    { label: t('inventory.received'), value: balance.receivedQty, color: 'bg-green-400' },
    { label: isFood ? t('inventory.consumed') : t('inventory.issued'), value: isFood ? balance.consumedQty : balance.issuedQty, color: 'bg-orange-400' },
    { label: t('inventory.remainingQty'), value: balance.remainingQty, color: 'bg-indigo-400' },
  ];

  const linkedMovements = MOVEMENTS.filter(m => {
    const mItem = m.item as any;
    return mItem?._id === item?._id || mItem === item?._id;
  }).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={backPath} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900 flex-1">{item?.name || '—'}</h1>
        <StatusBadge status={balance.status} />
      </div>

      <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-slate-500">{t('common.type')}</span><p className="font-medium mt-0.5"><Badge variant={isFood ? 'green' : 'blue'}>{isFood ? t('status.food') : t('status.material')}</Badge></p></div>
        <div><span className="text-slate-500">{t('common.category')}</span><p className="font-medium">{item?.category?.name || '—'}</p></div>
        <div><span className="text-slate-500">{t('common.unit')}</span><p className="font-medium">{item?.unit || '—'}</p></div>
        <div><span className="text-slate-500">{t('common.period')}</span><p className="font-medium">{balance.period || '—'}</p></div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">{t('inventory.balanceBreakdown')}</h2>
        <div className="space-y-3">
          {segments.map(seg => {
            const max = Math.max(total, 1);
            const pct = Math.min(Math.round((seg.value / max) * 100), 100);
            return (
              <div key={seg.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{seg.label}</span>
                  <span className="font-semibold text-slate-900">{seg.value}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${seg.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {segments.map(seg => (
            <div key={seg.label} className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-900">{seg.value}</p>
              <p className="text-xs text-slate-500">{seg.label}</p>
            </div>
          ))}
        </div>
      </div>

      {linkedMovements.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">{t('inventory.linkedMovements')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{[t('common.date'), t('common.type'), t('common.quantity'), t('common.project'), t('common.notes')].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linkedMovements.map(m => (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.movementDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={['RECEIVE','RETURN','TRANSFER_IN'].includes(m.movementType) ? 'green' : ['ISSUE','CONSUMPTION','DAMAGE'].includes(m.movementType) ? 'red' : 'gray'}>
                      {m.movementType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-500">{(m.project as any)?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
