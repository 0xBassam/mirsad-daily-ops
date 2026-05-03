import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Report } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { ArrowLeft, Download } from 'lucide-react';

const TYPE_COLORS: Record<string, 'blue' | 'green' | 'indigo' | 'yellow' | 'gray'> = {
  daily_floor_check: 'blue',
  daily_project_summary: 'indigo',
  weekly_warehouse: 'green',
  monthly_food_inventory: 'yellow',
  monthly_materials: 'gray',
  approval_summary: 'indigo',
};

export function ReportDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => apiClient.get(`/reports/${id}`).then(r => r.data.data),
  });

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['report-data', id],
    queryFn: () => apiClient.get(`/reports/${id}/data`).then(r => r.data.data),
    enabled: !!id,
  });

  if (reportLoading || !reportData) return <PageLoader />;

  const r = reportData as Report;
  const headers: string[]   = previewData?.headers || [];
  const rows: Record<string, string>[] = previewData?.rows || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/reports" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold text-slate-900 flex-1">{r.title}</h1>
        <StatusBadge status={r.status} />
      </div>

      <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-slate-500">{t('reports.reportType')}</span>
          <p className="font-medium mt-0.5"><Badge variant={TYPE_COLORS[r.reportType] || 'gray'}>{t(`reports.${r.reportType}`)}</Badge></p>
        </div>
        <div>
          <span className="text-slate-500">{t('common.project')}</span>
          <p className="font-medium">{r.project?.name || '—'}</p>
        </div>
        <div>
          <span className="text-slate-500">{t('reports.dateRange')}</span>
          <p className="font-medium">{formatDate(r.dateFrom)} – {formatDate(r.dateTo)}</p>
        </div>
        <div>
          <span className="text-slate-500">{t('reports.generatedBy')}</span>
          <p className="font-medium">{r.generatedBy?.fullName || '—'}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {t('reports.preview')}
            {!previewLoading && <span className="ms-2 text-xs text-slate-400 font-normal">({rows.length} {t('common.rows')})</span>}
          </h2>
          <div className="flex gap-3">
            <a href="#" className="btn-primary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> {t('reports.exportPdf')}
            </a>
            <a href="#" className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> {t('reports.exportExcel')}
            </a>
          </div>
        </div>
        {previewLoading ? (
          <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-400">{t('common.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-slate-700">
                        {j === Object.keys(row).length - 1 && typeof val === 'string' && ['ok','draft','submitted','approved','rejected','confirmed','active','resolved','closed','available','low_stock','out_of_stock'].includes(val)
                          ? <StatusBadge status={val} />
                          : String(val ?? '—')
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
