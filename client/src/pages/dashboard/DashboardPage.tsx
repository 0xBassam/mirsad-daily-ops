import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, parseISO } from 'date-fns';
import apiClient from '../../api/client';
import { DashboardStats } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import {
  CheckSquare, FileText, AlertTriangle, Clock, ThumbsUp, XCircle,
  Package, Warehouse, TrendingDown, Thermometer, ShieldCheck, Bell,
  BarChart2, TrendingUp, GitBranch, ShoppingCart, ArrowRightLeft, Wrench, MessageSquare,
} from 'lucide-react';

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w: string) => w[0] || '').join('').toUpperCase();
}

function KpiCard({ icon: Icon, label, value, bg, border }: {
  icon: React.ElementType; label: string; value: number; bg: string; border: string;
}) {
  return (
    <div className={`kpi-card border-s-4 ${border}`}>
      <div className={`p-3 rounded-xl ${bg} flex-shrink-0`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1 leading-snug">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, dot, text }: { label: string; value: number; dot: string; text: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-base font-bold ${text}`}>{value}</span>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const pct = data.checks.total > 0 ? Math.round((data.checks.completed / data.checks.total) * 100) : 0;
  const foodTotal = data.foodInventory.available + data.foodInventory.lowStock + data.foodInventory.outOfStock + data.foodInventory.overConsumed;
  const matTotal = data.materialsInventory.available + data.materialsInventory.lowStock + data.materialsInventory.outOfStock;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* ── Row 1: Hero KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Clock}
          label={t('dashboard.pendingApprovals')}
          value={data.pendingApprovals}
          bg="bg-amber-500" border="border-amber-400"
        />
        <KpiCard
          icon={CheckSquare}
          label={t('dashboard.pending') + ' ' + t('nav.floorChecks')}
          value={data.checks.pending}
          bg="bg-indigo-500" border="border-indigo-400"
        />
        <KpiCard
          icon={AlertTriangle}
          label={t('dashboard.shortageItems')}
          value={data.shortages}
          bg="bg-red-500" border="border-red-400"
        />
        <KpiCard
          icon={Bell}
          label={t('dashboard.expiringIn3Days')}
          value={data.expiringIn3Days ?? 0}
          bg="bg-orange-500" border="border-orange-400"
        />
      </div>

      {/* ── Row 2: Operations ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Floor Checks progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              {t('dashboard.todayChecks')}
            </h3>
            <span className="text-2xl font-bold text-slate-900">{data.checks.total}</span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{t('dashboard.completed')}</span>
              <span className="font-medium text-slate-700">{pct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-2.5">
              <p className="text-xl font-bold text-green-700">{data.checks.completed}</p>
              <p className="text-xs text-green-600 mt-0.5">{t('dashboard.completed')}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5">
              <p className="text-xl font-bold text-amber-700">{data.checks.pending}</p>
              <p className="text-xs text-amber-600 mt-0.5">{t('dashboard.pending')}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-xl font-bold text-slate-600">{data.checks.total - data.checks.completed - data.checks.pending}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('status.draft')}</p>
            </div>
          </div>
        </div>

        {/* Reports & Approvals */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <GitBranch className="h-4 w-4 text-amber-500" />
            {t('dashboard.reportsApprovals')}
          </h3>
          <MiniStat label={t('dashboard.pendingApprovals')} value={data.pendingApprovals} dot="bg-amber-500"  text="text-amber-600" />
          <MiniStat label={t('dashboard.submitted')}        value={data.reports.submitted} dot="bg-blue-500"   text="text-blue-600" />
          <MiniStat label={t('dashboard.approved')}         value={data.reports.approved}  dot="bg-green-500"  text="text-green-600" />
          <MiniStat label={t('dashboard.rejected')}         value={data.reports.rejected}  dot="bg-red-500"    text="text-red-600" />
        </div>
      </div>

      {/* ── Row 3: Inventory Health ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Food Inventory */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-green-500" /> {t('dashboard.foodInventory')}
          </h3>
          <div className="space-y-3">
            {[
              { label: t('status.available'),    val: data.foodInventory.available,    bar: 'bg-green-500',  text: 'text-green-700' },
              { label: t('status.low_stock'),     val: data.foodInventory.lowStock,     bar: 'bg-amber-500',  text: 'text-amber-700' },
              { label: t('status.out_of_stock'),  val: data.foodInventory.outOfStock,   bar: 'bg-red-500',    text: 'text-red-700' },
              { label: t('status.over_consumed'), val: data.foodInventory.overConsumed, bar: 'bg-red-700',    text: 'text-red-800' },
            ].map(({ label, val, bar, text }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold ${text}`}>{val}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${foodTotal > 0 ? Math.round((val / foodTotal) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials Inventory */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-blue-500" /> {t('nav.materialsWarehouse')}
          </h3>
          <div className="space-y-3">
            {[
              { label: t('status.available'),   val: data.materialsInventory.available, bar: 'bg-green-500', text: 'text-green-700' },
              { label: t('status.low_stock'),    val: data.materialsInventory.lowStock,  bar: 'bg-amber-500', text: 'text-amber-700' },
              { label: t('status.out_of_stock'), val: data.materialsInventory.outOfStock,bar: 'bg-red-500',   text: 'text-red-700' },
            ].map(({ label, val, bar, text }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold ${text}`}>{val}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${matTotal > 0 ? Math.round((val / matTotal) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
            {/* Extra materials stat */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t('dashboard.shortageItems')}</span>
                <span className="text-sm font-bold text-red-600">{data.shortages}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Operations Overview ── */}
      {(data.openPurchaseOrders !== undefined || data.pendingTransfers !== undefined) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('dashboard.operations')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.openPurchaseOrders !== undefined && (
              <div className="alert-card border-indigo-400">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.openPurchaseOrders')}</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{data.openPurchaseOrders}</p>
              </div>
            )}
            {data.pendingTransfers !== undefined && (
              <div className="alert-card border-sky-400">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-sky-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.pendingTransfers')}</p>
                </div>
                <p className="text-2xl font-bold text-sky-600">{data.pendingTransfers}</p>
              </div>
            )}
            {data.openMaintenanceRequests !== undefined && (
              <div className="alert-card border-yellow-400">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-yellow-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.openMaintenanceRequests')}</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{data.openMaintenanceRequests}</p>
              </div>
            )}
            {data.pendingClientRequests !== undefined && (
              <div className="alert-card border-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.pendingClientRequests')}</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{data.pendingClientRequests}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 5: Food Safety Alerts ── */}
      {(data.expiringIn3Days !== undefined || data.activeCorrectiveActions !== undefined) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('nav.foodSafety')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.expiringIn3Days !== undefined && (
              <div className="alert-card border-amber-400">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.expiringIn3Days')}</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{data.expiringIn3Days}</p>
              </div>
            )}
            {data.activeCorrectiveActions !== undefined && (
              <div className="alert-card border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.activeCorrectiveActions')}</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{data.activeCorrectiveActions}</p>
              </div>
            )}
            {data.fridgeChecksToday !== undefined && (
              <div className="alert-card border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.fridgeChecksToday')}</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{data.fridgeChecksToday}</p>
              </div>
            )}
            {data.activeSpoilageAlerts !== undefined && (
              <div className="alert-card border-red-400">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-slate-500 font-medium">{t('dashboard.activeSpoilageAlerts')}</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{data.activeSpoilageAlerts}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 6: Analytics ── */}
      {(data.topConsumedItems?.length || data.checksByFloor?.length) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topConsumedItems?.length ? (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" /> {t('dashboard.topConsumedItems')}
              </h3>
              <div className="space-y-3.5">
                {data.topConsumedItems.map((item, i) => {
                  const max = data.topConsumedItems![0].consumed;
                  const pct2 = max > 0 ? Math.round((item.consumed / max) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4 text-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-700 truncate max-w-[70%]">{item.name}</span>
                          <span className="font-semibold text-slate-900 flex-shrink-0">{item.consumed}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${pct2}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {data.checksByFloor?.length ? (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" /> {t('dashboard.checksByFloor')}
              </h3>
              <div className="space-y-3.5">
                {data.checksByFloor.map((floor, i) => {
                  const max = data.checksByFloor![0].count;
                  const pct3 = max > 0 ? Math.round((floor.count / max) * 100) : 0;
                  return (
                    <div key={floor.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4 text-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-700 truncate max-w-[70%]">{floor.name}</span>
                          <span className="font-semibold text-slate-900 flex-shrink-0">{floor.count} {t('dashboard.checks')}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" style={{ width: `${pct3}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Row 7: Recent Activity ── */}
      {data.recentActivity.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{t('dashboard.recentActivity')}</h3>
            <span className="text-xs text-slate-400">{data.recentActivity.length} {t('dashboard.checks')}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentActivity.slice(0, 8).map((rec: any) => (
              <div key={rec._id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials((rec.actor as any)?.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{(rec.actor as any)?.fullName || 'System'}</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-slate-500 capitalize">{rec.action}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDistanceToNow(parseISO(rec.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <StatusBadge status={rec.action} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
