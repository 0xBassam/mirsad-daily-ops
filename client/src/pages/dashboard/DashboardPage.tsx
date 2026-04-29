import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { DashboardStats } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatDate';
import {
  CheckSquare, FileText, AlertTriangle, Clock, ThumbsUp, XCircle,
  Package, Warehouse, TrendingDown, Users
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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time operations overview</p>
      </div>

      {/* Today's Checks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Today's Floor Checks</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={CheckSquare} label="Total Checks" value={data.checks.total} color="bg-indigo-500" />
          <StatCard icon={ThumbsUp} label="Completed" value={data.checks.completed} color="bg-green-500" />
          <StatCard icon={Clock} label="Pending" value={data.checks.pending} color="bg-amber-500" />
        </div>
      </div>

      {/* Reports */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Pending Approvals" value={data.pendingApprovals} color="bg-amber-500" />
          <StatCard icon={FileText} label="Submitted" value={data.reports.submitted} color="bg-blue-500" />
          <StatCard icon={ThumbsUp} label="Approved" value={data.reports.approved} color="bg-green-500" />
          <StatCard icon={XCircle} label="Rejected" value={data.reports.rejected} color="bg-red-500" />
        </div>
      </div>

      {/* Inventory Alerts */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Inventory Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={AlertTriangle} label="Shortage Items" value={data.shortages} color="bg-red-500" />
          <StatCard icon={TrendingDown} label="Low Stock" value={data.lowStock} color="bg-amber-500" />
          <StatCard icon={Package} label="Out of Stock" value={data.outOfStock} color="bg-red-600" />
        </div>
      </div>

      {/* Inventory Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-green-500" /> Food Inventory
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Available', val: data.foodInventory.available, color: 'bg-green-500' },
              { label: 'Low Stock', val: data.foodInventory.lowStock, color: 'bg-amber-500' },
              { label: 'Out of Stock', val: data.foodInventory.outOfStock, color: 'bg-red-500' },
              { label: 'Over Consumed', val: data.foodInventory.overConsumed, color: 'bg-red-700' },
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
            <Warehouse className="h-4 w-4 text-blue-500" /> Materials Warehouse
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Available', val: data.materialsInventory.available, color: 'bg-green-500' },
              { label: 'Low Stock', val: data.materialsInventory.lowStock, color: 'bg-amber-500' },
              { label: 'Out of Stock', val: data.materialsInventory.outOfStock, color: 'bg-red-500' },
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
            <h3 className="font-semibold text-slate-800">Recent Approval Activity</h3>
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
    </div>
  );
}
