import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface OrgDetail {
  _id: string; name: string; slug: string; plan: string; status: string;
  maxUsers: number; maxProjects: number; storageLimitMb: number;
  trialEndsAt?: string; planExpiresAt?: string;
  suspendedAt?: string; suspendedReason?: string;
  featureFlags: Record<string, boolean>;
}

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

export function SuperAdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [planForm, setPlanForm] = useState({ plan: '', maxUsers: 0, maxProjects: 0 });
  const [suspendReason, setSuspendReason] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiClient.get(`/super-admin/organizations/${id}`)
      .then(r => {
        const { org: o, users: u, projects: p } = r.data.data;
        setOrg(o);
        setUsers(u);
        setProjects(p);
        setPlanForm({ plan: o.plan, maxUsers: o.maxUsers, maxProjects: o.maxProjects });
        setFlags(o.featureFlags || {});
      })
      .catch(() => toast.error('Failed to load organization'))
      .finally(() => setLoading(false));
  }, [id]);

  async function savePlan() {
    setSaving(true);
    try {
      const { data } = await apiClient.patch(`/super-admin/organizations/${id}/plan`, planForm);
      setOrg(data.data);
      toast.success('Plan updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  async function suspend() {
    if (!confirm('Suspend this organization?')) return;
    try {
      const { data } = await apiClient.patch(`/super-admin/organizations/${id}/suspend`, { reason: suspendReason });
      setOrg(data.data);
      toast.success('Organization suspended');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Suspend failed');
    }
  }

  async function reactivate() {
    if (!confirm('Reactivate this organization?')) return;
    try {
      const { data } = await apiClient.patch(`/super-admin/organizations/${id}/reactivate`);
      setOrg(data.data);
      toast.success('Organization reactivated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reactivate failed');
    }
  }

  async function saveFlags() {
    setSaving(true);
    try {
      await apiClient.patch(`/super-admin/organizations/${id}/feature-flags`, { featureFlags: flags });
      toast.success('Feature flags updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!org)    return <div className="p-8 text-red-500">Organization not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/super-admin/organizations" className="text-indigo-600 hover:underline text-sm">← Organizations</Link>
        <h1 className="text-xl font-bold text-slate-900">{org.name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[org.status] || 'bg-slate-100 text-slate-500'}`}>
          {org.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan management */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Plan & Limits</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Plan</label>
            <select className="input" value={planForm.plan} onChange={e => setPlanForm(f => ({ ...f, plan: e.target.value }))}>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Users</label>
              <input type="number" className="input" value={planForm.maxUsers}
                onChange={e => setPlanForm(f => ({ ...f, maxUsers: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Projects</label>
              <input type="number" className="input" value={planForm.maxProjects}
                onChange={e => setPlanForm(f => ({ ...f, maxProjects: +e.target.value }))} />
            </div>
          </div>
          <button onClick={savePlan} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Saving…' : 'Update Plan'}
          </button>
        </div>

        {/* Status management */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Status</h2>
          {org.status !== 'suspended' ? (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Suspend Reason (optional)</label>
                <input type="text" className="input" value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)} placeholder="Policy violation…" />
              </div>
              <button onClick={suspend} className="w-full py-2 px-4 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium transition-colors">
                Suspend Organization
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Suspended {org.suspendedAt ? new Date(org.suspendedAt).toLocaleDateString() : ''}
                {org.suspendedReason ? ` — ${org.suspendedReason}` : ''}
              </p>
              <button onClick={reactivate} className="btn-primary w-full justify-center">Reactivate</button>
            </>
          )}
        </div>
      </div>

      {/* Feature flags */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Feature Flags</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {Object.entries(flags).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={val}
                onChange={e => setFlags(f => ({ ...f, [key]: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>
        <button onClick={saveFlags} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Flags'}
        </button>
      </div>

      {/* Users */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Users ({users.length})</h2>
        <div className="space-y-1">
          {users.map(u => (
            <div key={u._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{u.fullName}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span className="text-xs text-slate-500 capitalize">{u.role.replace(/_/g, ' ')}</span>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-slate-400">No users</p>}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Projects ({projects.length})</h2>
        <div className="space-y-1">
          {projects.map(p => (
            <div key={p._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <p className="text-sm font-medium text-slate-800">{p.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {p.status}
              </span>
            </div>
          ))}
          {projects.length === 0 && <p className="text-sm text-slate-400">No projects</p>}
        </div>
      </div>
    </div>
  );
}
