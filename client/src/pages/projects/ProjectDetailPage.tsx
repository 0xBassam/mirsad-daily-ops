import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { Project } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { ArrowLeft, Building2, Layers, Users, CheckSquare } from 'lucide-react';
import { BUILDINGS, FLOORS, USERS, FLOOR_CHECKS } from '../../mocks/data';

export function ProjectDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.get(`/projects/${id}`).then(r => r.data.data),
  });

  if (isLoading || !data) return <PageLoader />;

  const project = data as Project;

  const buildings = BUILDINGS.filter(b => (b.project as any)?._id === id);
  const floors = FLOORS.filter(f => (f.project as any)?._id === id);
  const users = USERS.filter(u => (u.project as any)?._id === id);
  const checks = FLOOR_CHECKS.filter(fc => (fc.project as any)?._id === id);
  const recentChecks = checks.slice(0, 5);

  const stats = [
    { icon: Building2, label: t('nav.buildings'), value: buildings.length, color: 'bg-indigo-500' },
    { icon: Layers, label: t('nav.floors'), value: floors.length, color: 'bg-blue-500' },
    { icon: Users, label: t('projects.activeUsers'), value: users.length, color: 'bg-green-500' },
    { icon: CheckSquare, label: t('projects.recentChecks'), value: checks.length, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900 flex-1">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>

      <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-slate-500">{t('projects.clientName')}</span><p className="font-medium">{project.clientName || '—'}</p></div>
        <div><span className="text-slate-500">{t('common.locationCode')}</span><p className="font-medium">{project.locationCode || '—'}</p></div>
        <div><span className="text-slate-500">{t('common.status')}</span><p className="font-medium capitalize">{project.status}</p></div>
        <div><span className="text-slate-500">{t('common.createdAt')}</span><p className="font-medium">{formatDate(project.createdAt)}</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">{t('nav.buildings')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{[t('common.name'), t('common.status')].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {buildings.map(b => (
              <tr key={b._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recentChecks.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">{t('projects.recentChecks')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{[t('common.date'), t('common.floor'), t('common.supervisor'), t('common.status')].map(h => <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentChecks.map(fc => (
                <tr key={fc._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/floor-checks/${fc._id}`)}>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatDate(fc.date)}</td>
                  <td className="px-4 py-3 text-slate-500">{(fc.floor as any)?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{(fc.supervisor as any)?.fullName || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={fc.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
