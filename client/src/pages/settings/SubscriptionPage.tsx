import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface Subscription {
  plan: string; status: string;
  trialEndsAt?: string; planExpiresAt?: string; suspendedAt?: string;
  maxUsers: number; maxProjects: number; storageLimitMb: number;
  featureFlags: Record<string, boolean>;
}

const PLAN_COLORS: Record<string, string> = {
  trial:        'bg-amber-50 border-amber-200 text-amber-800',
  starter:      'bg-blue-50 border-blue-200 text-blue-800',
  professional: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  enterprise:   'bg-purple-50 border-purple-200 text-purple-800',
};

export function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/settings/subscription')
      .then(r => setSub(r.data.data))
      .catch(() => toast.error('Failed to load subscription'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!sub)    return <div className="p-8 text-red-500">Failed to load subscription info.</div>;

  const storagGb = (sub.storageLimitMb / 1024).toFixed(1);
  const planClass = PLAN_COLORS[sub.plan] || 'bg-slate-50 border-slate-200 text-slate-800';

  const enabledFeatures  = Object.entries(sub.featureFlags).filter(([, v]) => v).map(([k]) => k);
  const disabledFeatures = Object.entries(sub.featureFlags).filter(([, v]) => !v).map(([k]) => k);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>

      {/* Plan badge */}
      <div className={`rounded-xl border p-5 ${planClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Current Plan</p>
            <p className="text-3xl font-bold capitalize mt-1">{sub.plan}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium border ${
            sub.status === 'active'    ? 'bg-green-100 border-green-300 text-green-800' :
            sub.status === 'trial'     ? 'bg-amber-100 border-amber-300 text-amber-800' :
            sub.status === 'suspended' ? 'bg-red-100 border-red-300 text-red-800' :
            'bg-slate-100 border-slate-300 text-slate-700'
          }`}>{sub.status}</span>
        </div>

        {sub.trialEndsAt && sub.status === 'trial' && (
          <p className="mt-2 text-sm opacity-80">
            Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
          </p>
        )}
        {sub.planExpiresAt && (
          <p className="mt-2 text-sm opacity-80">
            Plan expires {new Date(sub.planExpiresAt).toLocaleDateString()}
          </p>
        )}
        {sub.suspendedAt && (
          <p className="mt-2 text-sm opacity-80">
            Suspended since {new Date(sub.suspendedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Resource Limits</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Max Users',    value: sub.maxUsers === 999 ? 'Unlimited' : sub.maxUsers },
            { label: 'Max Projects', value: sub.maxProjects === 99 ? 'Unlimited' : sub.maxProjects },
            { label: 'Storage',      value: `${storagGb} GB` },
          ].map(item => (
            <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature flags */}
      {(enabledFeatures.length > 0 || disabledFeatures.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Features</h2>
          <div className="grid grid-cols-2 gap-2">
            {enabledFeatures.map(k => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-sm text-slate-700 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              </div>
            ))}
            {disabledFeatures.map(k => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">✗</span>
                <span className="text-sm text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        To upgrade or modify your subscription, contact your platform administrator.
      </p>
    </div>
  );
}
