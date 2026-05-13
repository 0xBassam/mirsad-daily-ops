import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface Org {
  _id: string; name: string; slug: string; plan: string; status: string;
  maxUsers: number; maxProjects: number; userCount: number; createdAt: string;
}

interface Pagination { total: number; page: number; limit: number; pages: number; }

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export function SuperAdminOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');

  const page   = parseInt(searchParams.get('page')   || '1');
  const status = searchParams.get('status') || '';
  const plan   = searchParams.get('plan')   || '';

  function fetchOrgs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)      params.set('q',      q);
    if (status) params.set('status', status);
    if (plan)   params.set('plan',   plan);
    params.set('page', String(page));
    params.set('limit', '20');

    apiClient.get(`/super-admin/organizations?${params}`)
      .then(r => { setOrgs(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchOrgs(); }, [page, status, plan]);

  function filter(key: string, val: string) {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (q) p.set('q', q); else p.delete('q');
    p.delete('page');
    setSearchParams(p);
    fetchOrgs();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <Link to="/super-admin" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={search} className="flex gap-2">
          <input className="input w-52" placeholder="Search name or slug…" value={q}
            onChange={e => setQ(e.target.value)} />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <select className="input w-36" value={status} onChange={e => filter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="input w-36" value={plan} onChange={e => filter('plan', e.target.value)}>
          <option value="">All plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 py-8">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Users</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map(org => (
                <tr key={org._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/super-admin/organizations/${org._id}`}
                      className="font-medium text-indigo-600 hover:underline">{org.name}</Link>
                    <p className="text-xs text-slate-400">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{org.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[org.status] || 'bg-slate-100 text-slate-500'}`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{org.userCount} / {org.maxUsers}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No organizations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => filter('page', String(p))}
              className={`px-3 py-1 rounded text-sm border ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
