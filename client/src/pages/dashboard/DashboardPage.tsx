import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats, DashboardRequestRow, DashboardReceivingRow, DashboardPORow, DashboardLowStockRow } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { downloadExport } from '../../utils/downloadExport';
import toast from 'react-hot-toast';
import {
  ClipboardList, Coffee, Package, Warehouse, ShoppingCart,
  CheckCircle, TrendingDown, ArrowDownToLine, Bell,
  BarChart2, TrendingUp, Download,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  submitted:          'bg-amber-100 text-amber-700',
  assigned:           'bg-indigo-100 text-indigo-700',
  in_progress:        'bg-blue-100 text-blue-700',
  delivered:          'bg-violet-100 text-violet-700',
  confirmed:          'bg-emerald-100 text-emerald-700',
  rejected:           'bg-red-100 text-red-700',
  pending:            'bg-slate-100 text-slate-600',
  partial:            'bg-orange-100 text-orange-700',
  active:             'bg-blue-100 text-blue-700',
  partially_received: 'bg-amber-100 text-amber-700',
  fully_received:     'bg-emerald-100 text-emerald-700',
  near_depletion:     'bg-orange-100 text-orange-700',
  over_consumed:      'bg-red-100 text-red-700',
  low_stock:          'bg-amber-100 text-amber-700',
  out_of_stock:       'bg-red-100 text-red-700',
};

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-slate-300',
  medium: 'bg-blue-400',
  high:   'bg-orange-400',
  urgent: 'bg-red-500',
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, bg, accent, highlight }: {
  icon: React.ElementType; label: string; value: number;
  bg: string; accent: string; highlight?: boolean;
}) {
  const isAlert = !!(highlight && value > 0);
  return (
    <div className={`bg-white rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md border ${isAlert ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {isAlert && <div className={`h-2 w-2 rounded-full mt-1 ${bg}`} />}
      </div>
      <div>
        <p className={`text-3xl font-extrabold leading-none tabular-nums ${isAlert ? accent : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-1.5 leading-snug font-medium">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${className}`}>
      {children}
    </th>
  );
}

function CardHeader({ icon: Icon, title, iconBg, badge, badgeColor, onExport }: {
  icon: React.ElementType; title: string; iconBg: string;
  badge?: number; badgeColor?: string; onExport?: () => void;
}) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {badge !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge > 0 ? (badgeColor ?? 'bg-indigo-100 text-indigo-700') : 'bg-slate-100 text-slate-500'}`}>
            {badge}
          </span>
        )}
      </div>
      {onExport && (
        <button onClick={onExport} title="Export" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function RequestTable({ rows, emptyLabel }: { rows: DashboardRequestRow[]; emptyLabel: string }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">{emptyLabel}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th className="w-[42%]">Request</Th>
            <Th>Floor</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Time</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors last:border-0">
              <td className="py-3 px-4">
                <p className="font-semibold text-slate-800 truncate max-w-[220px]" title={r.title}>{r.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.itemCount} item{r.itemCount !== 1 ? 's' : ''}</p>
              </td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{r.floor}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[r.priority] ?? 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-600 capitalize">{r.priority}</span>
                </div>
              </td>
              <td className="py-3 px-4"><StatusPill status={r.status} /></td>
              <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                {formatDistanceToNow(parseISO(r.createdAt), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceivingTable({ rows }: { rows: DashboardReceivingRow[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">No receiving records</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>Supplier</Th>
            <Th>Date</Th>
            <Th>Items</Th>
            <Th>Invoice</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-b border-slate-50 hover:bg-teal-50/30 transition-colors last:border-0">
              <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate" title={r.supplierName}>{r.supplierName}</td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{format(parseISO(r.deliveryDate), 'dd MMM yyyy')}</td>
              <td className="py-3 px-4 text-slate-600">{r.lineCount} items</td>
              <td className="py-3 px-4 text-slate-500 font-mono text-xs">{r.invoiceNumber || '—'}</td>
              <td className="py-3 px-4"><StatusPill status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function POTable({ rows }: { rows: DashboardPORow[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">No purchase orders</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>PO #</Th>
            <Th>Supplier</Th>
            <Th>Month</Th>
            <Th>Received</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors last:border-0">
              <td className="py-3 px-4 font-mono text-xs text-indigo-700 font-bold whitespace-nowrap">{r.poNumber}</td>
              <td className="py-3 px-4 text-slate-700 max-w-[160px] truncate" title={r.supplierName}>{r.supplierName}</td>
              <td className="py-3 px-4 text-slate-500 text-xs font-medium">{r.month}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.receivedPct >= 100 ? 'bg-emerald-500' : r.receivedPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${r.receivedPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">{r.receivedPct}%</span>
                </div>
              </td>
              <td className="py-3 px-4"><StatusPill status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LowStockTable({ rows }: { rows: DashboardLowStockRow[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">All items well stocked</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>Item</Th>
            <Th>Type</Th>
            <Th>Remaining</Th>
            <Th>Limit</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors last:border-0">
              <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === 'food' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {r.type}
                </span>
              </td>
              <td className="py-3 px-4 font-bold text-slate-700 tabular-nums">
                {r.remainingQty} <span className="font-normal text-slate-400 text-xs">{r.unit}</span>
              </td>
              <td className="py-3 px-4 text-slate-400 text-xs tabular-nums">{r.monthlyLimit} {r.unit}</td>
              <td className="py-3 px-4"><StatusPill status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniStat({ label, value, dot, text }: { label: string; value: number; dot: string; text: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-base font-bold tabular-nums ${text}`}>{value}</span>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { orgName } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const foodTotal  = data.foodInventory.available + data.foodInventory.lowStock + data.foodInventory.outOfStock + data.foodInventory.overConsumed;
  const matTotal   = data.materialsInventory.available + data.materialsInventory.lowStock + data.materialsInventory.outOfStock;
  const totalAlerts = (data.activeSpoilageAlerts ?? 0) + (data.activeCorrectiveActions ?? 0) + (data.expiringIn3Days ?? 0);

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-900 text-white p-6 shadow-lg">
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-[0.18em] mb-1.5">
              {orgName || 'Mirsad'} · Daily Operations
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-indigo-200/80 text-sm mt-1.5">
              Cafeteria Operations Management ·{' '}
              {new Date().toLocaleDateString('en-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 flex-shrink-0">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">System</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-sm font-semibold text-white">Live · Operational</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/10 pointer-events-none" />
      </div>

      {/* ── KPI Row ── */}
      <div className="space-y-3">
        <SectionHeader>Today's Operations</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={ClipboardList}   label="Operation Requests"    value={data.operationRequestsOpen ?? 0}                    bg="bg-indigo-500" accent="text-indigo-600" highlight />
          <KpiCard icon={Coffee}          label="Coffee Break Requests" value={data.coffeeBreakRequestsOpen ?? 0}                   bg="bg-purple-500" accent="text-purple-600" highlight />
          <KpiCard icon={ArrowDownToLine} label="Receiving Today"       value={data.receivingToday ?? 0}                           bg="bg-teal-500"   accent="text-teal-600" />
          <KpiCard icon={ShoppingCart}    label="Active Purchase Orders" value={data.openPurchaseOrders ?? 0}                       bg="bg-blue-500"   accent="text-blue-600" />
          <KpiCard icon={TrendingDown}    label="Low / Out of Stock"    value={(data.lowStock ?? 0) + (data.outOfStock ?? 0)}       bg="bg-amber-500"  accent="text-amber-600" highlight />
          <KpiCard icon={Bell}            label="Active Alerts"         value={totalAlerts}                                        bg="bg-red-500"    accent="text-red-600"  highlight />
        </div>
      </div>

      {/* ── Inventory Health ── */}
      <div className="space-y-3">
        <SectionHeader>Inventory Status — {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Food Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-green-500"><Package className="h-4 w-4 text-white" /></div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Food Inventory</h3>
                <p className="text-xs text-slate-400">{foodTotal} categories tracked</p>
              </div>
              <div className="ms-auto text-right">
                <span className="text-2xl font-bold text-green-600">{Math.round(data.foodInventory.available / Math.max(1, foodTotal) * 100)}%</span>
                <p className="text-xs text-slate-400">healthy</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {[
                { label: 'Available',     val: data.foodInventory.available,    bar: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Low Stock',     val: data.foodInventory.lowStock,     bar: 'bg-amber-500',   text: 'text-amber-700' },
                { label: 'Out of Stock',  val: data.foodInventory.outOfStock,   bar: 'bg-red-500',     text: 'text-red-700' },
                { label: 'Over Consumed', val: data.foodInventory.overConsumed, bar: 'bg-red-700',     text: 'text-red-800' },
              ].map(({ label, val, bar, text }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${text}`}>{val} items</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${foodTotal > 0 ? Math.round((val / foodTotal) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-blue-500"><Warehouse className="h-4 w-4 text-white" /></div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Materials Inventory</h3>
                <p className="text-xs text-slate-400">{matTotal} categories tracked</p>
              </div>
              <div className="ms-auto text-right">
                <span className="text-2xl font-bold text-blue-600">{Math.round(data.materialsInventory.available / Math.max(1, matTotal) * 100)}%</span>
                <p className="text-xs text-slate-400">available</p>
              </div>
            </div>
            <div className="space-y-3.5 mb-5">
              {[
                { label: 'Available',    val: data.materialsInventory.available,  bar: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Low Stock',    val: data.materialsInventory.lowStock,   bar: 'bg-amber-500',   text: 'text-amber-700' },
                { label: 'Out of Stock', val: data.materialsInventory.outOfStock, bar: 'bg-red-500',     text: 'text-red-700' },
              ].map(({ label, val, bar, text }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${text}`}>{val} items</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${matTotal > 0 ? Math.round((val / matTotal) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-0">
              <MiniStat label="Shortage Items"    value={data.shortages}                    dot="bg-red-500"    text="text-red-600" />
              <MiniStat label="Pending Transfers" value={data.pendingTransfers ?? 0}        dot="bg-sky-500"    text="text-sky-600" />
              <MiniStat label="Open Maintenance"  value={data.openMaintenanceRequests ?? 0} dot="bg-yellow-500" text="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Latest Requests ── */}
      <div className="space-y-3">
        <SectionHeader>Latest Requests</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ClipboardList} title="Operation Requests" iconBg="bg-indigo-500"
              badge={data.operationRequestsOpen ?? 0} badgeColor="bg-indigo-100 text-indigo-700"
              onExport={() => downloadExport('/export/operation-requests/excel', `Mirsad_Operation_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <RequestTable rows={data.latestOperationRequests ?? []} emptyLabel="No operation requests" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={Coffee} title="Coffee Break Requests" iconBg="bg-purple-500"
              badge={data.coffeeBreakRequestsOpen ?? 0} badgeColor="bg-purple-100 text-purple-700"
              onExport={() => downloadExport('/export/coffee-break-requests/excel', `Mirsad_Coffee_Break_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <RequestTable rows={data.latestCoffeeBreakRequests ?? []} emptyLabel="No coffee break requests" />
          </div>
        </div>
      </div>

      {/* ── Receiving & POs ── */}
      <div className="space-y-3">
        <SectionHeader>Receiving & Purchase Orders</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ArrowDownToLine} title="Recent Receiving" iconBg="bg-teal-500"
              badge={data.receivingToday ?? 0} badgeColor="bg-teal-100 text-teal-700"
              onExport={() => downloadExport('/export/receiving/excel', `Mirsad_Receiving_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <ReceivingTable rows={data.latestReceiving ?? []} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ShoppingCart} title="Purchase Orders" iconBg="bg-blue-500"
              badge={data.openPurchaseOrders ?? 0} badgeColor="bg-blue-100 text-blue-700"
              onExport={() => downloadExport('/export/purchase-orders/excel', `Mirsad_Purchase_Orders_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <POTable rows={data.recentPurchaseOrders ?? []} />
          </div>
        </div>
      </div>

      {/* ── Stock Alerts & Floor Safety ── */}
      <div className="space-y-3">
        <SectionHeader>Stock Alerts & Floor Safety</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={TrendingDown} title="Low Stock Items" iconBg="bg-amber-500"
              badge={(data.lowStock + data.outOfStock)} badgeColor="bg-amber-100 text-amber-700"
              onExport={() => downloadExport('/export/inventory/excel', `Mirsad_Inventory_Report_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <LowStockTable rows={data.lowStockItemsList ?? []} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500"><CheckCircle className="h-4 w-4 text-white" /></div>
              <h3 className="font-semibold text-slate-800 text-sm">Floor Checks & Food Safety</h3>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-500">Today's Completion</span>
                <span className="text-slate-700">
                  {data.checks.total > 0 ? Math.round((data.checks.completed / data.checks.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.checks.total > 0 ? Math.round((data.checks.completed / data.checks.total) * 100) : 0}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: data.checks.completed, label: 'Done',      color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
                  { val: data.checks.pending,   label: 'Pending',   color: 'bg-amber-50 text-amber-700 border border-amber-100' },
                  { val: data.pendingApprovals, label: 'Approvals', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
                ].map(({ val, label, color }) => (
                  <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                    <p className="text-xl font-bold tabular-nums">{val}</p>
                    <p className="text-xs font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2 space-y-0">
              <MiniStat label="Expiring in 3 Days"     value={data.expiringIn3Days ?? 0}        dot="bg-amber-400"  text="text-amber-600" />
              <MiniStat label="Active Spoilage Alerts"  value={data.activeSpoilageAlerts ?? 0}   dot="bg-red-500"    text="text-red-600" />
              <MiniStat label="Corrective Actions Open" value={data.activeCorrectiveActions ?? 0} dot="bg-orange-500" text="text-orange-600" />
              <MiniStat label="Fridge Checks Today"     value={data.fridgeChecksToday ?? 0}      dot="bg-blue-500"   text="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics ── */}
      {(data.topConsumedItems?.length || data.checksByFloor?.length) ? (
        <div className="space-y-3">
          <SectionHeader>Analytics & Insights</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topConsumedItems?.length ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500"><TrendingUp className="h-4 w-4 text-white" /></div>
                  <h3 className="font-semibold text-slate-800 text-sm">Top Consumed Items</h3>
                </div>
                <div className="space-y-3">
                  {data.topConsumedItems.map((item, i) => {
                    const max = data.topConsumedItems![0].consumed;
                    const pct = max > 0 ? Math.round((item.consumed / max) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate max-w-[70%] font-medium">{item.name}</span>
                            <span className="font-bold text-slate-900 tabular-nums">{item.consumed}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {data.checksByFloor?.length ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-500"><BarChart2 className="h-4 w-4 text-white" /></div>
                  <h3 className="font-semibold text-slate-800 text-sm">Checks by Floor</h3>
                </div>
                <div className="space-y-3">
                  {data.checksByFloor.map((floor, i) => {
                    const max = data.checksByFloor![0].count;
                    const pct = max > 0 ? Math.round((floor.count / max) * 100) : 0;
                    return (
                      <div key={floor.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate max-w-[70%] font-medium">{floor.name}</span>
                            <span className="font-bold text-slate-900 tabular-nums">{floor.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Recent Activity ── */}
      {data.recentActivity.length > 0 && (
        <div className="space-y-3">
          <SectionHeader>Recent Activity</SectionHeader>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-50">
              {data.recentActivity.slice(0, 8).map((rec: any) => (
                <div key={rec._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                    {((rec.actor as any)?.fullName || 'S').split(' ').map((w: string) => w[0] || '').join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">{(rec.actor as any)?.fullName || 'System'}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-500 capitalize">{rec.action} {rec.entityType?.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(parseISO(rec.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
