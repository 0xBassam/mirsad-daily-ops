import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShieldOff, CheckCircle, AlertTriangle, Clock, ChefHat } from 'lucide-react';
import apiClient from '../../api/client';
import { UserRole, PlanLineStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const ALLOWED_ROLES: UserRole[] = ['admin', 'kitchen', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations'];

const LINE_STATUS_COLOR: Record<PlanLineStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  shortage: 'bg-red-100 text-red-700',
};

interface TaskLine {
  _id: string;
  dailyPlan: { _id: string; date: string; shift: string; status: string; building?: { _id: string; name: string } } | string;
  floor: { _id: string; name: string } | string;
  item: { _id: string; name: string; unit: string } | string;
  plannedQty: number;
  actualQty: number;
  lineStatus: PlanLineStatus;
  notes?: string;
}

export function KitchenDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ actualQty: number; notes: string }>({ actualQty: 0, notes: '' });

  const isAllowed = user ? ALLOWED_ROLES.includes(user.role as UserRole) : false;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kitchen-today'],
    queryFn: () => apiClient.get('/daily-plans/kitchen/today').then(r => r.data.data as TaskLine[]),
    enabled: isAllowed,
    retry: false,
    refetchInterval: 60_000,
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, planId, body }: { lineId: string; planId: string; body: Record<string, unknown> }) =>
      apiClient.put(`/daily-plans/${planId}/lines/${lineId}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kitchen-today'] }); setEditingLine(null); toast.success(t('common.save')); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  function getPlanId(line: TaskLine): string {
    return typeof line.dailyPlan === 'object' ? line.dailyPlan._id : line.dailyPlan;
  }

  function getLabel(field: { name: string } | string | undefined): string {
    return field && typeof field === 'object' ? field.name : (field as string) || '—';
  }

  function handleComplete(line: TaskLine) {
    updateLineMutation.mutate({
      lineId: line._id,
      planId: getPlanId(line),
      body: { actualQty: editValues.actualQty, lineStatus: 'completed' as PlanLineStatus, notes: editValues.notes },
    });
  }

  function handleShortage(line: TaskLine) {
    updateLineMutation.mutate({
      lineId: line._id,
      planId: getPlanId(line),
      body: { actualQty: editValues.actualQty, lineStatus: 'shortage' as PlanLineStatus, notes: editValues.notes },
    });
  }

  function handleInProgress(line: TaskLine) {
    updateLineMutation.mutate({
      lineId: line._id,
      planId: getPlanId(line),
      body: { lineStatus: 'in_progress' as PlanLineStatus },
    });
  }

  function openEdit(line: TaskLine) {
    setEditingLine(line._id);
    setEditValues({ actualQty: line.actualQty ?? 0, notes: line.notes || '' });
  }

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">{t('common.accessDenied')}</h2>
        <p className="text-sm text-slate-400 max-w-sm">{t('common.accessDeniedDesc')}</p>
        <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">{t('common.loadError')}</h2>
        <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
      </div>
    );
  }

  const lines = data ?? [];
  const total = lines.length;
  const completed = lines.filter(l => l.lineStatus === 'completed').length;
  const pending = lines.filter(l => l.lineStatus === 'pending').length;
  const inProgress = lines.filter(l => l.lineStatus === 'in_progress').length;
  const shortage = lines.filter(l => l.lineStatus === 'shortage').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChefHat className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">{t('kitchen.title')}</h1>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-slate-700">{total}</p>
          <p className="text-sm text-slate-500 mt-1">{t('kitchen.totalTasks')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{completed}</p>
          <p className="text-sm text-slate-500 mt-1">{t('kitchen.completed')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{pending + inProgress}</p>
          <p className="text-sm text-slate-500 mt-1">{t('kitchen.pending')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{shortage}</p>
          <p className="text-sm text-slate-500 mt-1">{t('kitchen.shortage')}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">{t('kitchen.todaysTasks')}</h2>
        {lines.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{t('kitchen.noTasks')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map(line => {
              const itemName = getLabel(line.item as any);
              const floorName = getLabel(line.floor as any);
              const unit = line.item && typeof line.item === 'object' ? (line.item as any).unit : '';
              const isEditing = editingLine === line._id;
              const isDone = line.lineStatus === 'completed' || line.lineStatus === 'shortage';

              return (
                <div key={line._id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800">{itemName}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${LINE_STATUS_COLOR[line.lineStatus]}`}>
                          {t(`status.${line.lineStatus}`)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {t('common.floor')}: {floorName} · {t('dailyPlans.plannedQty')}: {line.plannedQty} {unit}
                        {line.actualQty > 0 && ` · ${t('dailyPlans.actualQty')}: ${line.actualQty} ${unit}`}
                      </p>
                      {line.notes && <p className="text-xs text-slate-400 mt-1">{line.notes}</p>}
                    </div>
                    {!isDone && !isEditing && (
                      <div className="flex items-center gap-2 shrink-0">
                        {line.lineStatus === 'pending' && (
                          <button
                            onClick={() => handleInProgress(line)}
                            disabled={updateLineMutation.isPending}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            {t('status.in_progress')}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(line)}
                          className="btn-primary text-xs py-1 px-2"
                        >
                          {t('kitchen.confirmQty')}
                        </button>
                      </div>
                    )}
                    {isDone && (
                      <div className="shrink-0">
                        {line.lineStatus === 'completed'
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <AlertTriangle className="h-5 w-5 text-red-500" />
                        }
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t('dailyPlans.actualQty')} ({unit})</label>
                          <input
                            type="number"
                            min="0"
                            className="input text-sm"
                            value={editValues.actualQty}
                            onChange={e => setEditValues(v => ({ ...v, actualQty: +e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.notes')}</label>
                          <input
                            className="input text-sm"
                            value={editValues.notes}
                            onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                            placeholder={t('kitchen.shortage_note')}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleComplete(line)}
                          disabled={updateLineMutation.isPending}
                          className="btn-primary text-sm flex items-center gap-1.5"
                        >
                          <CheckCircle className="h-4 w-4" /> {t('dailyPlans.markComplete')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShortage(line)}
                          disabled={updateLineMutation.isPending}
                          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="h-4 w-4" /> {t('dailyPlans.reportShortage')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLine(null)}
                          className="btn-secondary text-sm"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
