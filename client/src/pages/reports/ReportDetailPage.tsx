import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Report } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { ArrowLeft, Download } from 'lucide-react';
import { FLOOR_CHECKS, INVENTORY_FOOD, INVENTORY_MATERIALS } from '../../mocks/data';

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

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => apiClient.get(`/reports/${id}`).then(r => r.data.data),
  });

  if (isLoading || !report) return <PageLoader />;

  const r = report as Report;

  const previewRows = (() => {
    if (r.reportType === 'monthly_food_inventory') {
      return INVENTORY_FOOD.slice(0, 8).map(inv => ({
        col1: (inv.item as any).name,
        col2: (inv.item as any).unit,
        col3: String(inv.openingBalance),
        col4: String(inv.receivedQty),
        col5: String(inv.consumedQty),
        col6: String(inv.remainingQty),
      }));
    }
    if (r.reportType === 'monthly_materials') {
      return INVENTORY_MATERIALS.slice(0, 8).map(inv => ({
        col1: (inv.item as any).name,
        col2: (inv.item as any).unit,
        col3: String(inv.openingBalance),
        col4: String(inv.receivedQty),
        col5: String(inv.issuedQty),
        col6: String(inv.remainingQty),
      }));
    }
    return FLOOR_CHECKS.slice(0, 8).map(fc => ({
      col1: formatDate(fc.date),
      col2: (fc.floor as any).name,
      col3: (fc.building as any).name,
      col4: (fc.supervisor as any).fullName,
      col5: fc.shift,
      col6: fc.status,
    }));
  })();

  const headers = r.reportType === 'monthly_food_inventory' || r.reportType === 'monthly_materials'
    ? [t('common.name'), t('common.unit'), t('inventory.opening'), t('inventory.received'), r.reportType === 'monthly_food_inventory' ? t('inventory.consumed') : t('inventory.issued'), t('inventory.remainingQty')]
    : [t('common.date'), t('common.floor'), t('common.building'), t('common.supervisor'), t('common.shift'), t('common.status')];

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
          <h2 className="font-semibold text-slate-800">{t('reports.preview')}</h2>
          <div className="flex gap-3">
            <a href="#" className="btn-primary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> {t('reports.exportPdf')}
            </a>
            <a href="#" className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="h-4 w-4" /> {t('reports.exportExcel')}
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{headers.map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.col1}</td>
                  <td className="px-4 py-3 text-slate-500">{row.col2}</td>
                  <td className="px-4 py-3 text-slate-500">{row.col3}</td>
                  <td className="px-4 py-3 text-slate-500">{row.col4}</td>
                  <td className="px-4 py-3 text-slate-500">{row.col5}</td>
                  <td className="px-4 py-3">
                    {r.reportType === 'daily_floor_check' || r.reportType === 'daily_project_summary' || r.reportType === 'approval_summary'
                      ? <StatusBadge status={row.col6} />
                      : <span className="text-slate-900 font-medium">{row.col6}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
