import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Report } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import { Download } from 'lucide-react';

const TYPE_COLORS: Record<string, 'blue' | 'green' | 'indigo' | 'yellow' | 'gray'> = {
  daily_floor_check: 'blue',
  daily_project_summary: 'indigo',
  weekly_warehouse: 'green',
  monthly_food_inventory: 'yellow',
  monthly_materials: 'gray',
  approval_summary: 'indigo',
};

export function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: () => apiClient.get(`/reports?page=${page}&limit=20`).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.name'), t('reports.reportType'), t('common.project'), t('reports.dateRange'), t('common.status'), t('common.createdBy'), ''].map(h => (
              <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((r: Report) => (
              <tr key={r._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/reports/${r._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">{r.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={TYPE_COLORS[r.reportType] || 'gray'}>{t(`reports.${r.reportType}`)}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{r.project?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.dateFrom)} – {formatDate(r.dateTo)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-slate-500">{r.generatedBy?.fullName || '—'}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <a href="#" className="text-slate-400 hover:text-red-600" title={t('reports.exportPdf')}>
                    <Download className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
