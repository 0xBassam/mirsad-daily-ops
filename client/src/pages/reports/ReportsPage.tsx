import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Report } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import { downloadExport } from '../../utils/downloadExport';
import { Download, Plus, X } from 'lucide-react';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, 'blue' | 'green' | 'indigo' | 'yellow' | 'gray'> = {
  daily_floor_check: 'blue',
  daily_project_summary: 'indigo',
  weekly_warehouse: 'green',
  monthly_food_inventory: 'yellow',
  monthly_materials: 'gray',
  approval_summary: 'indigo',
};

const REPORT_TYPES = [
  'daily_floor_check',
  'daily_project_summary',
  'weekly_warehouse',
  'monthly_food_inventory',
  'monthly_materials',
  'approval_summary',
] as const;

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

interface GenerateForm {
  reportType: string;
  project: string;
  dateFrom: string;
  dateTo: string;
}

function GenerateModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<GenerateForm>({ reportType: 'daily_floor_check', project: '', dateFrom: monthStart, dateTo: today });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiClient.get('/projects', { params: { limit: 50 } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (body: object) => apiClient.post('/reports', body).then(r => r.data),
    onSuccess: (res) => {
      toast.success(t('reports.generated'));
      qc.invalidateQueries({ queryKey: ['reports'] });
      onClose();
      navigate(`/reports/${res.data._id}`);
    },
    onError: () => toast.error(t('common.error')),
  });

  function f(k: keyof GenerateForm, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t('reports.generateNew')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, project: form.project || undefined }); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('reports.reportType')} *</label>
            <select className="input w-full" value={form.reportType} onChange={e => f('reportType', e.target.value)}>
              {REPORT_TYPES.map(rt => <option key={rt} value={rt}>{t(`reports.${rt}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.project')}</label>
            <select className="input w-full" value={form.project} onChange={e => f('project', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {(projectsData?.data || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.from')} *</label>
              <input type="date" className="input w-full" value={form.dateFrom} onChange={e => f('dateFrom', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.to')} *</label>
              <input type="date" className="input w-full" value={form.dateTo} onChange={e => f('dateTo', e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('reports.generate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: () => apiClient.get('/reports', { params: { page, limit: 20 } }).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> {t('reports.generateNew')}
        </button>
      </div>

      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{[t('common.name'), t('reports.reportType'), t('common.project'), t('reports.dateRange'), t('common.status'), t('common.createdBy'), ...(!IS_DEMO ? [''] : [])].map(h => (
              <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((r: Report) => (
              <tr key={r._id} className={`hover:bg-slate-50 ${!IS_DEMO ? 'cursor-pointer' : ''}`} onClick={() => !IS_DEMO && navigate(`/reports/${r._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{r.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={TYPE_COLORS[r.reportType] || 'gray'}>{t(`reports.${r.reportType}`)}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{r.project?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.dateFrom)} – {formatDate(r.dateTo)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-slate-500">{r.generatedBy?.fullName || '—'}</td>
                {!IS_DEMO && (
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button
                    className="text-slate-400 hover:text-indigo-600"
                    title={t('reports.exportPdf')}
                    onClick={() => downloadExport(`/export/reports/${r._id}/pdf`, `Mirsad_Report_${r._id}.pdf`).catch(() => toast.error(t('common.error')))}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </td>
                )}
              </tr>
            ))}
            {(!data?.data || data.data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
