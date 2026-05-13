import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { CorrectiveAction } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

export function CorrectiveActionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['corrective-actions', id],
    queryFn: () => apiClient.get(`/corrective-actions/${id}`).then(r => r.data),
  });

  const action: CorrectiveAction | undefined = data?.data;

  async function handleResolve() {
    if (!resolution.trim()) { toast.error('Please enter resolution notes'); return; }
    setResolving(true);
    try {
      await apiClient.put(`/corrective-actions/${id}`, { status: 'resolved', resolution });
      toast.success('Action resolved successfully');
      qc.invalidateQueries({ queryKey: ['corrective-actions'] });
      navigate(-1);
    } catch {
      toast.error('Failed to resolve action');
    } finally {
      setResolving(false);
    }
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  if (!action) return <div className="p-8 text-center text-slate-500">{t('common.noData')}</div>;

  const canResolve = action.status === 'open' || action.status === 'in_progress';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{action.title}</h1>
          <p className="text-sm text-slate-500">Created by {action.createdBy.fullName} · {new Date(action.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={action.priority} />
          <StatusBadge status={action.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
          <InfoRow label="Description" value={<p className="text-slate-600 leading-relaxed">{action.description}</p>} />
          <InfoRow label={t('common.assignedTo')} value={action.assignedTo.fullName} />
          <InfoRow label={t('common.dueDate')} value={new Date(action.dueDate).toLocaleDateString()} />
          <InfoRow label="Source" value={action.sourceType} />
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Resolution</h3>
          {action.resolution ? (
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">{action.resolution}</p>
              {action.resolvedAt && (
                <p className="text-xs text-slate-400 mt-2">Resolved on {new Date(action.resolvedAt).toLocaleString()}</p>
              )}
            </div>
          ) : canResolve ? (
            <div className="space-y-3">
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Describe the resolution taken…"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              />
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="btn-primary w-full justify-center"
              >
                <CheckCircle className="h-4 w-4" />
                {resolving ? 'Resolving…' : t('common.resolve')}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No resolution recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
