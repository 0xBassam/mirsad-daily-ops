import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { DashboardStats } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatDate';
import {
  CheckSquare, FileText, AlertTriangle, Clock, ThumbsUp, XCircle,
  Package, Warehouse, TrendingDown, Thermometer, ShieldCheck, Bell,
  BarChart2, TrendingUp
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Today's Checks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('dashboard.todayChecks')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={CheckSquare} label={t('dashboard.total')} value={data.checks.total} color="bg-indigo-500" />
          <StatCard icon={ThumbsUp} label={t('dashboard.completed')} value={data.checks.completed} color="bg-green-500" />
          <StatCard icon={Clock} label={t('dashboard.pending')} value={data.checks.pending} color="bg-amber-500" />
        </div>
      </div>

      {/* Reports */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('dashboard.reportsApprovals')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Clock} label={t('dashboard.pendingApprovals')} value={data.pendingApprovals} color="bg-amber-500" />
          <StatCard icon={FileText} label={t('dashboard.submitted')} value={data.reports.submitted} color="bg-blue-500" />
          <StatCard icon={ThumbsUp} label={t('dashboard.approved')} value={data.reports.approved} color="bg-green-500" />
          <StatCard icon={XCircle} label={t('dashboard.rejected')} value={data.reports.rejected} color="bg-red-500" />
        </div>
      </div>

      {/* Inventory Alerts */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('dashboard.materialsWarehouse')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={AlertTriangle} label={t('dashboard.shortageItems')} value={data.shortages} color="bg-red-500" />
          <StatCard icon={TrendingDown} label={t('dashboard.lowStock')} value={data.lowStock} color="bg-amber-500" />
          <StatCard icon={Package} label={t('dashboard.outOfStock')} value={data.outOfStock} color="bg-red-600" />
        </div>
      </div>

      {/* Phase 2: Food Safety & Corrective Actions */}
      {(data.expiringIn3Days !== undefined || data.activeCorrectiveActions !== undefined) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('nav.foodSafety')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.expiringIn3Days !== undefined && (
              <StatCard icon={Clock} label={t('dashboard.expiringIn3Days')} value={data.expiringIn3Days} color="bg-amber-500" />
            )}
            {data.activeCorrectiveActions !== undefined && (
              <StatCard icon={ShieldCheck} label={t('dashboard.activeCorrectiveActions')} value={data.activeCorrectiveActions} color="bg-orange-500" />
            )}
            {data.fridgeChecksToday !== undefined && (
              <StatCard icon={Thermometer} label={t('dashboard.fridgeChecksToday')} value={data.fridgeChecksToday} color="bg-blue-500" />
            )}
            {data.activeSpoilageAlerts !== undefined && (
              <StatCard icon={Bell} label={t('dashboard.activeSpoilageAlerts')} value={data.activeSpoilageAlerts} color="bg-red-500" />
            )}
          </div>
        </div>
      )}

      {/* Inventory Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-green-500" /> {t('dashboard.foodInventory')}
          </h3>
          <div className="space-y-2">
            {[
              { label: t('status.available'), val: data.foodInventory.available, color: 'bg-green-500' },
              { label: t('status.low_stock'), val: data.foodInventory.lowStock, color: 'bg-amber-500' },
              { label: t('status.out_of_stock'), val: data.foodInventory.outOfStock, color: 'bg-red-500' },
              { label: t('status.over_consumed'), val: data.foodInventory.overConsumed, color: 'bg-red-700' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-slate-600">{label}</span>
                </div>
                <span className="font-semibold text-slate-900">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-blue-500" /> {t('nav.materialsWarehouse')}
          </h3>
          <div className="space-y-2">
            {[
              { label: t('status.available'), val: data.materialsInventory.available, color: 'bg-green-500' },
              { label: t('status.low_stock'), val: data.materialsInventory.lowStock, color: 'bg-amber-500' },
              { label: t('status.out_of_stock'), val: data.materialsInventory.outOfStock, color: 'bg-red-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-slate-600">{label}</span>
                </div>
                <span className="font-semibold text-slate-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">{t('dashboard.recentActivity')}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentActivity.slice(0, 8).map((rec: any) => (
              <div key={rec._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-800 font-medium">{(rec.actor as any)?.fullName || 'System'}</span>
                  <span className="text-slate-400 mx-1 text-sm">·</span>
                  <span className="text-sm text-slate-500">{rec.action.toUpperCase()} on {rec.entityType?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rec.action} />
                  <span className="text-xs text-slate-400">{formatDateTime(rec.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Consumed Items & Checks by Floor */}
      {(data.topConsumedItems?.length || data.checksByFloor?.length) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topConsumedItems?.length ? (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" /> {t('dashboard.topConsumedItems')}
              </h3>
              <div className="space-y-3">
                {data.topConsumedItems.map((item, i) => {
                  const max = data.topConsumedItems![0].consumed;
                  const pct = max > 0 ? Math.round((item.consumed / max) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 truncate max-w-[70%]">{item.name}</span>
                        <span className="font-semibold text-slate-900">{item.consumed}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
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
              <div className="space-y-3">
                {data.checksByFloor.map((floor) => {
                  const max = data.checksByFloor![0].count;
                  const pct = max > 0 ? Math.round((floor.count / max) * 100) : 0;
                  return (
                    <div key={floor.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 truncate max-w-[70%]">{floor.name}</span>
                        <span className="font-semibold text-slate-900">{floor.count} {t('dashboard.checks')}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
