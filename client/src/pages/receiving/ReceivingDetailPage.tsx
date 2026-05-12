import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Truck, CheckCircle2, FileText, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import apiClient from '../../api/client';
import { Receiving } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';

const MEAL_COLORS: Record<string, string> = {
  breakfast:    'border-amber-200  bg-amber-50  text-amber-800',
  lunch:        'border-orange-200 bg-orange-50 text-orange-800',
  dinner:       'border-indigo-200 bg-indigo-50 text-indigo-800',
  coffee_break: 'border-purple-200 bg-purple-50 text-purple-800',
};

function TodayMenuPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [open, setOpen] = useState(true);

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menu', today, projectId],
    queryFn: () => apiClient.get('/menu', { params: { date: today, project: projectId } }).then(r => r.data.data as any[]),
    enabled: !!projectId,
  });

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
          <UtensilsCrossed className="h-4 w-4" />
          {t('menu.todayReference')}
        </div>
        <ChevronDown className={`h-4 w-4 text-indigo-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-4">
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-3">{t('common.loading')}</p>
          ) : menus.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">{t('menu.noMenuToday')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menus.map((menu: any) => (
                <div key={menu._id} className={`rounded-xl border p-3 ${MEAL_COLORS[menu.mealType] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  <p className="font-semibold text-sm mb-2">
                    {t(`menu.mealTypes.${menu.mealType}`)}
                    <span className="ms-2 font-normal text-xs opacity-70">({menu.items?.length ?? 0} {t('menu.items')})</span>
                  </p>
                  {(menu.items ?? []).length > 0 && (
                    <ul className="space-y-0.5">
                      {menu.items.map((item: any, i: number) => (
                        <li key={i} className="text-xs flex justify-between">
                          <span>{item.name}</span>
                          <span className="font-mono tabular-nums">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CONDITION_COLORS: Record<string, string> = {
  good:     'bg-green-100 text-green-700',
  damaged:  'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

export function ReceivingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['receiving', id],
    queryFn: () => apiClient.get(`/receiving/${id}`).then(r => r.data.data as Receiving),
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiClient.post(`/receiving/${id}/confirm`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receiving', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="p-6 text-slate-500">{t('common.notFound')}</p>;

  const rec = data;
  const totalOrdered  = rec.lines.reduce((s, l) => s + l.quantityOrdered, 0);
  const totalReceived = rec.lines.reduce((s, l) => s + l.quantityReceived, 0);
  const rejectedCount = rec.lines.filter(l => l.condition === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm">
          <ArrowLeft className="h-4 w-4" />{t('common.back')}
        </button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-500" />
            {t('receiving.detail')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(rec.deliveryDate), 'dd MMMM yyyy')}
            {rec.invoiceNumber && <span className="ms-3 font-mono text-xs text-slate-400">#{rec.invoiceNumber}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={rec.status} />
          {['pending', 'partial'].includes(rec.status) && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {confirmMutation.isPending ? t('common.saving') : t('receiving.confirm')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('common.supplier')}</p>
          <p className="font-semibold text-slate-900">{(rec.supplier as any)?.name || '—'}</p>
          {(rec.supplier as any)?.contactName && <p className="text-xs text-slate-500 mt-0.5">{(rec.supplier as any).contactName}</p>}
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('receiving.poRef')}</p>
          <p className="font-semibold text-slate-900 font-mono">{(rec.purchaseOrder as any)?.poNumber || '—'}</p>
          {rec.purchaseOrder && <StatusBadge status={(rec.purchaseOrder as any)?.status || ''} />}
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('common.project')}</p>
          <p className="font-semibold text-slate-900">{(rec.project as any)?.name || '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('receiving.receivedBy')}: {(rec.receivedBy as any)?.fullName || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('receiving.totalOrdered'),  value: totalOrdered,  color: 'text-slate-900' },
          { label: t('receiving.totalReceived'), value: totalReceived, color: 'text-green-700' },
          { label: t('receiving.rejected'),      value: rejectedCount, color: rejectedCount > 0 ? 'text-red-600' : 'text-slate-400' },
        ].map(c => (
          <div key={c.label} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {rec.notes && (
        <div className="card p-4 flex items-start gap-3">
          <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600">{rec.notes}</p>
        </div>
      )}

      <TodayMenuPanel projectId={(rec.project as any)?._id ?? (rec.project as any)} />

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800 text-sm">{t('receiving.lines')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.item'), t('receiving.ordered'), t('receiving.received'), t('receiving.condition'), t('common.notes')].map(h => (
                <th key={h} className="px-3 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rec.lines.map((line, i) => {
              const pct = line.quantityOrdered > 0 ? Math.round((line.quantityReceived / line.quantityOrdered) * 100) : 100;
              return (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {(line.item as any)?.name || '—'}
                    {line.batchNumber && <span className="ms-2 text-xs font-mono text-slate-400">{line.batchNumber}</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{line.quantityOrdered} {(line.item as any)?.unit}</td>
                  <td className="px-3 py-3">
                    <div>
                      <span className="font-medium text-slate-900">{line.quantityReceived}</span>
                      <span className="text-slate-400 ms-1 text-xs">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                      <div className={`h-1 rounded-full ${pct < 100 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[line.condition] || 'bg-slate-100 text-slate-600'}`}>
                      {t(`receiving.conditions.${line.condition}`)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{line.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
