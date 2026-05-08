import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Star, Plus } from 'lucide-react';
import apiClient from '../../api/client';
import { Supplier } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={clsx('h-3.5 w-3.5', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
      ))}
      <span className="ms-1 text-xs text-slate-500">({rating})</span>
    </div>
  );
}

export function SuppliersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', category],
    queryFn: () => apiClient.get('/suppliers', { params: category ? { category } : {} }).then(r => r.data),
  });

  const suppliers: Supplier[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.suppliers')}</h1>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">{t('common.all')} {t('common.category')}</option>
          <option value="food">{t('status.food')}</option>
          <option value="material">{t('status.material')}</option>
          <option value="both">{t('status.both')}</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.name')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.category')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.phone')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.rating')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
              ) : suppliers.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    {s.nameAr && <div className="text-xs text-slate-500">{s.nameAr}</div>}
                    <div className="text-xs text-slate-500">{s.contactName}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.category} /></td>
                  <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                  <td className="px-4 py-3"><StarRating rating={s.rating} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/suppliers/${s._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors">
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
