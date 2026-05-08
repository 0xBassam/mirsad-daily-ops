import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Thermometer } from 'lucide-react';
import apiClient from '../../api/client';
import { FridgeCheck } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';

export function FridgeCheckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['fridge-checks', id],
    queryFn: () => apiClient.get(`/fridge-checks/${id}`).then(r => r.data),
  });

  const check: FridgeCheck | undefined = data?.data;

  if (isLoading) return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  if (!check) return <div className="p-8 text-center text-slate-500">{t('common.noData')}</div>;

  const tempOk = check.temperature >= check.expectedTempMin && check.temperature <= check.expectedTempMax;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fridge Check — {check.floor.name}</h1>
          <p className="text-sm text-slate-500">{new Date(check.date).toLocaleDateString()} · {check.building.name}</p>
        </div>
        <div className="ms-auto"><StatusBadge status={check.status} /></div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className={clsx('text-2xl font-bold', tempOk ? 'text-green-600' : 'text-red-600')}>
            {check.temperature}°C
          </div>
          <div className="text-xs text-slate-500 mt-1">Temperature</div>
          <div className="text-xs text-slate-400">({check.expectedTempMin}–{check.expectedTempMax}°C)</div>
        </div>
        <div className="card p-4 text-center">
          <div className={clsx('text-2xl font-bold', check.cleanlinessOk ? 'text-green-600' : 'text-red-600')}>
            {check.cleanlinessOk ? '✓' : '✗'}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t('common.cleanliness')}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{check.itemsChecked.length}</div>
          <div className="text-xs text-slate-500 mt-1">Items Checked</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-sm font-medium text-slate-800"><StatusBadge status={check.storageZone} /></div>
          <div className="text-xs text-slate-500 mt-1">Storage Zone</div>
        </div>
      </div>

      {/* Items checked */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Items Checked ({check.itemsChecked.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Item</th>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Batch</th>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Qty</th>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Expiry</th>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Condition</th>
              <th className="px-4 py-2.5 text-start font-medium text-slate-600">Name Tag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {check.itemsChecked.map(item => (
              <tr key={item._id} className={clsx('hover:bg-slate-50', (item.isExpired || item.condition === 'damaged') && 'bg-red-50')}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{item.item.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{item.batch.batchNumber}</td>
                <td className="px-4 py-2.5 text-slate-700">{item.quantity} {item.item.unit}</td>
                <td className="px-4 py-2.5">
                  <div className={clsx('text-sm', item.isExpired ? 'text-red-600 font-medium' : item.isNearExpiry ? 'text-amber-600' : 'text-slate-700')}>
                    {new Date(item.expiryDate).toLocaleDateString()}
                    {item.isExpired && ' (Expired)'}
                    {!item.isExpired && item.isNearExpiry && ' (Near)'}
                  </div>
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={item.condition} /></td>
                <td className="px-4 py-2.5">
                  <span className={item.nameTagPresent ? 'text-green-600' : 'text-red-600'}>
                    {item.nameTagPresent ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {check.cleanlinessNotes && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Cleanliness Notes</h3>
          <p className="text-sm text-slate-600">{check.cleanlinessNotes}</p>
        </div>
      )}
    </div>
  );
}
