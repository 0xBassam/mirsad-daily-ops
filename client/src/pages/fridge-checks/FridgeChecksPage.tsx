import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Thermometer } from 'lucide-react';
import apiClient from '../../api/client';
import { FridgeCheck } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';

function TempCell({ temp, min, max }: { temp: number; min: number; max: number }) {
  const ok = temp >= min && temp <= max;
  return (
    <div className={clsx('flex items-center gap-1.5', ok ? 'text-green-600' : 'text-red-600')}>
      <Thermometer className="h-3.5 w-3.5" />
      <span className="font-medium">{temp}°C</span>
      <span className="text-xs text-slate-400">({min}–{max})</span>
    </div>
  );
}

export function FridgeChecksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['fridge-checks', status],
    queryFn: () => apiClient.get('/fridge-checks', { params: status ? { status } : {} }).then(r => r.data),
  });

  const checks: FridgeCheck[] = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.fridgeChecks')}</h1>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="ok">OK</option>
          <option value="issue_found">Issue Found</option>
          <option value="corrective_action_required">Action Required</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.date')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.floor')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Zone</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.temperature')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.cleanliness')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">Checked By</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
              ) : checks.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">{new Date(c.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.floor.name}</div>
                    <div className="text-xs text-slate-500">{c.building.name}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.storageZone} /></td>
                  <td className="px-4 py-3">
                    <TempCell temp={c.temperature} min={c.expectedTempMin} max={c.expectedTempMax} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={c.cleanlinessOk ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {c.cleanlinessOk ? t('common.yes') : t('common.no')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.checkedBy.fullName}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/fridge-checks/${c._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors">
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
