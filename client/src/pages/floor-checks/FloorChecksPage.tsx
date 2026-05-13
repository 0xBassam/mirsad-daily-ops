import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import apiClient from '../../api/client';
import { FloorCheck, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';

const ALLOWED_ROLES: UserRole[] = ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations'];

export function FloorChecksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const isAllowed = user ? ALLOWED_ROLES.includes(user.role as UserRole) : false;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['floor-checks', page, statusFilter],
    queryFn: () => apiClient.get('/floor-checks', { params: { page, limit: 20, ...(statusFilter && { status: statusFilter }) } }).then(r => r.data),
    enabled: isAllowed,
    retry: false,
  });

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
    const status = (error as any)?.response?.status;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">
          {status === 403 ? t('common.accessDenied') : t('common.loadError')}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {status === 403 ? t('common.accessDeniedDesc') : `HTTP ${status ?? 'unknown'}`}
        </p>
        <Link to="/dashboard" className="btn-secondary text-sm">{t('common.backToDashboard')}</Link>
      </div>
    );
  }

  const statuses = ['', 'draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected'];
  const checks: FloorCheck[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.floorChecks')}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
            {s ? t(`status.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[t('common.date'), t('common.floor'), t('common.building'), t('common.supervisor'), t('common.shift'), t('common.status'), t('common.nextStep'), ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {checks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            ) : checks.map((c: FloorCheck) => (
              <tr key={c._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/floor-checks/${c._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{c.date ? formatDate(c.date) : '-'}</td>
                <td className="px-4 py-3 text-slate-600">{c.floor && typeof c.floor === 'object' ? c.floor.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{c.building && typeof c.building === 'object' ? c.building.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{c.supervisor && typeof c.supervisor === 'object' ? c.supervisor.fullName : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{c.shift ? t(`status.${c.shift}`) : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{c.currentApprovalStep?.replace(/_/g, ' ') ?? '-'}</td>
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
