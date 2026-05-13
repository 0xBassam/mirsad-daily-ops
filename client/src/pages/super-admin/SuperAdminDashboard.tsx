import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface Stats {
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  suspendedOrgs: number;
  totalUsers: number;
  totalRequests: number;
  planBreakdown: Record<string, number>;
  recentOrgs: Array<{ _id: string; name: string; slug: string; plan: string; status: string; createdAt: string }>;
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/super-admin/stats')
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!stats)  return <div className="p-8 text-red-500">Failed to load statistics.</div>;

  const cards = [
    { label: 'Total Organizations', value: stats.totalOrgs, color: 'text-indigo-600' },
    { label: 'Active',              value: stats.activeOrgs,    color: 'text-green-600' },
    { label: 'Trial',               value: stats.trialOrgs,     color: 'text-amber-600' },
    { label: 'Suspended',           value: stats.suspendedOrgs, color: 'text-red-600' },
    { label: 'Total Users',         value: stats.totalUsers,    color: 'text-blue-600' },
    { label: 'Total Requests',      value: stats.totalRequests, color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <Link to="/super-admin/organizations" className="btn-primary">Manage Organizations</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Plan Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                <span className="capitalize text-sm text-slate-700">{plan}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Recently Created</h2>
          <div className="space-y-2">
            {stats.recentOrgs.map(org => (
              <Link key={org._id} to={`/super-admin/organizations/${org._id}`}
                className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-1 rounded transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{org.name}</p>
                  <p className="text-xs text-slate-400">{org.slug}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    org.status === 'active'    ? 'bg-green-100 text-green-700' :
                    org.status === 'trial'     ? 'bg-amber-100 text-amber-700' :
                    org.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{org.status}</span>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{org.plan}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
