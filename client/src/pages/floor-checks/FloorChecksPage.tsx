import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { FloorCheck } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
export function FloorChecksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['floor-checks', page, statusFilter],
    queryFn: () => apiClient.get(`/floor-checks?page=${page}&limit=20&status=${statusFilter}`).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const statuses = ['', 'draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.floorChecks')}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
            {s ? t(`status.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.date'), t('common.floor'), t('common.building'), t('common.supervisor'), t('common.shift'), t('common.status'), t('common.nextStep'), ''].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((c: FloorCheck) => (
              <tr key={c._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/floor-checks/${c._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{formatDate(c.date)}</td>
                <td className="px-4 py-3 text-slate-600">{typeof c.floor === 'object' ? c.floor.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{typeof c.building === 'object' ? c.building.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{typeof c.supervisor === 'object' ? c.supervisor.fullName : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{c.shift ? t(`status.${c.shift}`) : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{c.currentApprovalStep?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-indigo-300">›</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
