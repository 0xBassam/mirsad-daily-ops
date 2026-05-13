import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { Menu, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-800',
  starter: 'bg-slate-100 text-slate-700',
  professional: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-violet-100 text-violet-700',
};

function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get('/settings/subscription')
      .then(({ data }) => {
        const end = data.data?.trialEndsAt;
        if (end) {
          const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
          setDaysLeft(Math.max(0, diff));
        }
      })
      .catch(() => {});
  }, []);

  if (daysLeft === null) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          {daysLeft > 0
            ? <>Free trial — <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> remaining</>
            : 'Your free trial has expired'}
        </span>
      </div>
      <Link
        to="/settings/subscription"
        className="flex-shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors"
      >
        Upgrade now
      </Link>
    </div>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { orgName, plan } = useAuth();

  const planLabel = PLAN_LABELS[plan] ?? plan;
  const planColor = PLAN_COLORS[plan] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed md:static inset-y-0 start-0 z-30 md:z-auto',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen
            ? 'translate-x-0'
            : 'ltr:-translate-x-full rtl:translate-x-full md:!translate-x-0',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
        {/* Trial banner — shown for all screen sizes */}
        {plan === 'trial' && <TrialBanner />}

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 touch-manipulation"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-800 text-sm truncate block">
              {orgName || 'Mirsad'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColor}`}>
            {planLabel}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
