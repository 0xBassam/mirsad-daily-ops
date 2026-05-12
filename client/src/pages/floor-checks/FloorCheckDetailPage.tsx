import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { FloorCheck, FloorCheckLine, ApprovalRecord } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Download } from 'lucide-react';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
import toast from 'react-hot-toast';

export function FloorCheckDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['floor-check', id],
    queryFn: () => apiClient.get(`/floor-checks/${id}`).then(r => r.data.data),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ action }: { action: string }) =>
      apiClient.post(`/approvals/floor_check/${id}/${action}`, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['floor-check', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('common.save'));
      setComment('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading || !data) return <PageLoader />;

  const check = data as FloorCheck & { lines: FloorCheckLine[] };

  const approvalActions: { action: string; labelKey: string; class: string }[] = (() => {
    switch (check.status) {
      case 'draft':     return [{ action: 'submit',  labelKey: 'common.submit',            class: 'btn-primary' }];
      case 'returned':  return [{ action: 'submit',  labelKey: 'common.submit',            class: 'btn-primary' }];
      case 'submitted': return [
        { action: 'review', labelKey: 'status.under_review', class: 'btn-primary' },
        { action: 'reject', labelKey: 'common.reject',       class: 'btn-danger'  },
      ];
      case 'under_review': return [
        { action: 'approve', labelKey: 'common.approve', class: 'btn-primary'   },
        { action: 'return',  labelKey: 'common.return',  class: 'btn-secondary' },
        { action: 'reject',  labelKey: 'common.reject',  class: 'btn-danger'    },
      ];
      default: return [];
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/floor-checks" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">{t('floorChecks.detail')} — {formatDate(check.date)}</h1>
        <StatusBadge status={check.status} />
      </div>

      <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-slate-500">{t('common.project')}</span><p className="font-medium">{typeof check.project === 'object' ? check.project.name : '-'}</p></div>
        <div><span className="text-slate-500">{t('common.building')}</span><p className="font-medium">{typeof check.building === 'object' ? check.building.name : '-'}</p></div>
        <div><span className="text-slate-500">{t('common.floor')}</span><p className="font-medium">{typeof check.floor === 'object' ? check.floor.name : '-'}</p></div>
        <div><span className="text-slate-500">{t('common.supervisor')}</span><p className="font-medium">{typeof check.supervisor === 'object' ? check.supervisor.fullName : '-'}</p></div>
        <div><span className="text-slate-500">{t('common.shift')}</span><p className="font-medium">{check.shift ? t(`status.${check.shift}`) : '-'}</p></div>
        <div><span className="text-slate-500">{t('common.nextStep')}</span><p className="font-medium capitalize">{check.currentApprovalStep?.replace(/_/g, ' ')}</p></div>
        {check.notes && <div className="col-span-2"><span className="text-slate-500">{t('common.notes')}</span><p>{check.notes}</p></div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">{t('floorChecks.lines')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{[t('common.name'), t('common.unit'), t('floorChecks.plannedQty'), t('floorChecks.actualQty'), t('floorChecks.difference'), t('floorChecks.lineStatus'), t('common.notes')].map(h => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {check.lines?.map((line: FloorCheckLine) => {
                const item = typeof line.item === 'object' ? line.item : null;
                return (
                  <tr key={line._id} className={line.lineStatus === 'shortage' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 font-medium">{item?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{item?.unit || '-'}</td>
                    <td className="px-4 py-3">{line.plannedQty}</td>
                    <td className="px-4 py-3 font-medium">{line.actualQty}</td>
                    <td className={`px-4 py-3 font-medium ${line.difference < 0 ? 'text-red-600' : line.difference > 0 ? 'text-green-600' : ''}`}>
                      {line.difference >= 0 ? '+' : ''}{line.difference}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={line.lineStatus} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{line.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(check.approvalRecords as any[])?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">{t('floorChecks.approvalHistory')}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(check.approvalRecords as any[]).map((rec: ApprovalRecord) => (
              <div key={rec._id} className="px-5 py-3 flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-800">{typeof rec.actor === 'object' ? rec.actor.fullName : '-'}</span>
                  <Badge variant="gray" className="ms-2">{rec.step?.replace(/_/g, ' ')}</Badge>
                  {rec.comment && <p className="text-xs text-slate-500 mt-1">"{rec.comment}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rec.action} />
                  <span className="text-xs text-slate-400">{formatDateTime(rec.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvalActions.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('floorChecks.approvalActions')}</h2>
          <textarea
            className="input mb-4"
            rows={2}
            placeholder={t('common.comment')}
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="flex gap-3 flex-wrap">
            {approvalActions.map(a => (
              <button key={a.action} className={a.class} onClick={() => approvalMutation.mutate({ action: a.action })} disabled={approvalMutation.isPending}>
                {t(a.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {check.status === 'approved' && !IS_DEMO && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">{t('reports.title')}</h2>
          <div className="flex gap-3">
            <a href="#" className="btn-primary flex items-center gap-2">
              <Download className="h-4 w-4" /> {t('floorChecks.exportPdf')}
            </a>
            <a href="#" className="btn-secondary flex items-center gap-2">
              <Download className="h-4 w-4" /> {t('floorChecks.exportExcel')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
