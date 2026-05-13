import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { DailyPlan } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import { Plus, Eye, Copy, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadExport } from '../../utils/downloadExport';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export function DailyPlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['daily-plans', page],
    queryFn: () => apiClient.get('/daily-plans', { params: { page, limit: 20 } }).then(r => r.data),
    retry: false,
  });

  const copyMutation = useMutation({
    mutationFn: (id: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return apiClient.post(`/daily-plans/${id}/copy`, { targetDate: tomorrow.toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-plans'] }); toast.success(t('dailyPlans.copiedMessage')); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/daily-plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-plans'] }); toast.success(t('common.delete')); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
      <p className="text-slate-500">{t('common.loadError')}</p>
      <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('dailyPlans.title')}</h1>
        <div className="flex items-center gap-2">
          {!IS_DEMO && <>
          <button onClick={() => downloadExport('/export/daily-plans/pdf', `Mirsad_Menu_Report_${new Date().toISOString().slice(0,10)}.pdf`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => downloadExport('/export/daily-plans/excel', `Mirsad_Menu_Report_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error(t('common.error')))} className="btn-secondary flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Excel
          </button>
          </>}
          <Link to="/daily-plans/new" className="btn-primary"><Plus className="h-4 w-4" /> {t('common.newPlan')}</Link>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.date'), t('common.project'), t('common.building'), t('common.shift'), t('common.status'), t('common.createdBy'), t('common.actions')].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!data?.data || data.data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">{t('common.noData')}</td></tr>
            )}
            {data?.data?.map((p: DailyPlan) => (
              <tr key={p._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/daily-plans/${p._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.date ? formatDate(p.date) : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.project && typeof p.project === 'object' ? p.project.name : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.building && typeof p.building === 'object' ? p.building.name : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.shift ? t(`status.${p.shift}`) : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-slate-500">{p.createdBy?.fullName || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => copyMutation.mutate(p._id)} className="text-slate-400 hover:text-green-600" title={t('dailyPlans.copy')}><Copy className="h-4 w-4" /></button>
                    {p.status === 'draft' && (
                      <button onClick={() => deleteMutation.mutate(p._id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
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
