import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { Batch } from '../../types';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { differenceInDays, parseISO } from 'date-fns';

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return <Badge variant="red">Expired {Math.abs(days)}d ago</Badge>;
  if (days === 0) return <Badge variant="red">Expires today</Badge>;
  if (days <= 3) return <Badge variant="red">{days}d left</Badge>;
  if (days <= 7) return <Badge variant="yellow">{days}d left</Badge>;
  return <Badge variant="green">{days}d left</Badge>;
}

export function BatchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [zone, setZone] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['batches', status, zone],
    queryFn: () => apiClient.get('/batches', { params: { ...(status && { status }), ...(zone && { storageZone: zone }) } }).then(r => r.data),
  });

  const batches: Batch[] = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.batches')}</h1>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="active">Active</option>
          <option value="consumed">Consumed</option>
          <option value="expired">Expired</option>
          <option value="spoiled">Spoiled</option>
        </select>
        <select className="input w-auto" value={zone} onChange={e => setZone(e.target.value)}>
          <option value="">{t('common.all')} Zone</option>
          <option value="cold">Cold</option>
          <option value="chilled">Chilled</option>
          <option value="freezer">Freezer</option>
          <option value="ambient">Ambient</option>
          <option value="dry_storage">Dry Storage</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.batchNumber')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Item</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.supplier')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Zone</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Qty / Remaining</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.expiryDate')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
              ) : batches.map(b => (
                <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">{b.batchNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{b.item.name}</div>
                    <div className="text-xs text-slate-500">{b.item.unit}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.supplier.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.storageZone} /></td>
                  <td className="px-4 py-3 text-slate-600">{b.remainingQty} / {b.quantity}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{new Date(b.expiryDate).toLocaleDateString()}</div>
                    {b.status === 'active' && <ExpiryBadge expiryDate={b.expiryDate} />}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/batches/${b._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
