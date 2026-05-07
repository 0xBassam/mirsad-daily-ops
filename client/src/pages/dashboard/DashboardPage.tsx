import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import apiClient from '../../api/client';
import { DashboardStats, DashboardRequestRow, DashboardReceivingRow, DashboardPORow, DashboardLowStockRow } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { downloadExport } from '../../utils/downloadExport';
import toast from 'react-hot-toast';
import {
  ClipboardList, Coffee, Package, Warehouse, ShoppingCart,
  AlertTriangle, CheckCircle, Clock, TrendingDown,
  ArrowDownToLine, Thermometer, ShieldCheck, Bell,
  BarChart2, TrendingUp, ArrowRightLeft, Wrench, Download,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  submitted:   'bg-blue-100 text-blue-700',
  assigned:    'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  delivered:   'bg-green-100 text-green-700',
  confirmed:   'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
  pending:     'bg-slate-100 text-slate-600',
  partial:     'bg-orange-100 text-orange-700',
  active:            'bg-blue-100 text-blue-700',
  partially_received:'bg-amber-100 text-amber-700',
  fully_received:    'bg-green-100 text-green-700',
  near_depletion:    'bg-orange-100 text-orange-700',
  over_consumed:     'bg-red-100 text-red-700',
  low_stock:         'bg-amber-100 text-amber-700',
  out_of_stock:      'bg-red-100 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-slate-400',
  medium: 'text-blue-500',
  high:   'text-orange-500',
  urgent: 'text-red-600',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

function KpiCard({ icon: Icon, label, value, sub, bg, border, highlight }: {
  icon: React.ElementType; label: string; value: number; sub?: string;
  bg: string; border: string; highlight?: boolean;
}) {
  return (
    <div className={`kpi-card border-s-4 ${border} ${highlight && value > 0 ? 'ring-1 ring-offset-1 ring-current/20' : ''}`}>
      <div className={`p-2.5 rounded-xl ${bg} flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 leading-snug">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</h2>;
}

function RequestTable({ rows, emptyLabel }: { rows: DashboardRequestRow[]; emptyLabel: string }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-4 text-center">{emptyLabel}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 w-[40%]">Request</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Floor</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Priority</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Status</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(r => (
            <tr key={r._id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3">
                <p className="font-medium text-slate-800 truncate max-w-[200px]" title={r.title}>{r.title}</p>
                <p className="text-xs text-slate-400">{r.itemCount} item{r.itemCount !== 1 ? 's' : ''}</p>
              </td>
              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{r.floor}</td>
              <td className="py-2.5 px-3">
                <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[r.priority] ?? 'text-slate-500'}`}>{r.priority}</span>
              </td>
              <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
              <td className="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">
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
  if (!rows.length) return <p className="text-sm text-slate-400 py-4 text-center">No receiving records</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Supplier</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Date</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Items</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Invoice</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(r => (
            <tr key={r._id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[160px] truncate" title={r.supplierName}>{r.supplierName}</td>
              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{format(parseISO(r.deliveryDate), 'dd MMM')}</td>
              <td className="py-2.5 px-3 text-slate-600">{r.lineCount} items</td>
              <td className="py-2.5 px-3 text-slate-500 text-xs">{r.invoiceNumber || '—'}</td>
              <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function POTable({ rows }: { rows: DashboardPORow[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-4 text-center">No purchase orders</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">PO #</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Supplier</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Month</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Received</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(r => (
            <tr key={r._id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-xs text-indigo-700 font-semibold whitespace-nowrap">{r.poNumber}</td>
              <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate" title={r.supplierName}>{r.supplierName}</td>
              <td className="py-2.5 px-3 text-slate-500 text-xs">{r.month}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${r.receivedPct}%` }} />
                  </div>
                  <span className="text-xs text-slate-600">{r.receivedPct}%</span>
                </div>
              </td>
              <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LowStockTable({ rows }: { rows: DashboardLowStockRow[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400 py-4 text-center">All items well stocked</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Item</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Type</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Remaining</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Limit</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-medium text-slate-800">{r.name}</td>
              <td className="py-2.5 px-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'food' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {r.type}
                </span>
              </td>
              <td className="py-2.5 px-3 font-semibold text-slate-700">{r.remainingQty} {r.unit}</td>
              <td className="py-2.5 px-3 text-slate-400 text-xs">{r.monthlyLimit} {r.unit}</td>
              <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
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

  const foodTotal = data.foodInventory.available + data.foodInventory.lowStock + data.foodInventory.outOfStock + data.foodInventory.overConsumed;
  const matTotal  = data.materialsInventory.available + data.materialsInventory.lowStock + data.materialsInventory.outOfStock;
  const totalAlerts = (data.activeSpoilageAlerts ?? 0) + (data.activeCorrectiveActions ?? 0) + (data.expiringIn3Days ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ministry of Energy — Cafeteria Operations · {new Date().toLocaleDateString('en-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* ── Row 1: Primary KPIs ── */}
      <SectionTitle>Today's Operations</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={ClipboardList} label="Operation Requests"    value={data.operationRequestsOpen ?? 0}  bg="bg-indigo-500"  border="border-indigo-400" highlight />
        <KpiCard icon={Coffee}        label="Coffee Break Requests" value={data.coffeeBreakRequestsOpen ?? 0} bg="bg-purple-500"  border="border-purple-400" highlight />
        <KpiCard icon={ArrowDownToLine} label="Receiving Today"     value={data.receivingToday ?? 0}          bg="bg-teal-500"    border="border-teal-400" />
        <KpiCard icon={ShoppingCart}  label="Open Purchase Orders"  value={data.openPurchaseOrders ?? 0}      bg="bg-blue-500"    border="border-blue-400" />
        <KpiCard icon={TrendingDown}  label="Low / Out of Stock"    value={(data.lowStock ?? 0) + (data.outOfStock ?? 0)} bg="bg-amber-500"  border="border-amber-400" highlight />
        <KpiCard icon={Bell}          label="Active Alerts"         value={totalAlerts}                       bg="bg-red-500"     border="border-red-400"  highlight />
      </div>

      {/* ── Row 2: Inventory Health ── */}
      <SectionTitle>Inventory Status — {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Food Inventory */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-green-500" /> Food Inventory
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Available',     val: data.foodInventory.available,    bar: 'bg-green-500', text: 'text-green-700' },
              { label: 'Low Stock',     val: data.foodInventory.lowStock,     bar: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Out of Stock',  val: data.foodInventory.outOfStock,   bar: 'bg-red-500',   text: 'text-red-700' },
              { label: 'Over Consumed', val: data.foodInventory.overConsumed, bar: 'bg-red-700',   text: 'text-red-800' },
            ].map(({ label, val, bar, text }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold ${text}`}>{val} items</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${foodTotal > 0 ? Math.round((val / foodTotal) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <span>{foodTotal} total food categories tracked</span>
            <span>{Math.round(data.foodInventory.available / Math.max(1, foodTotal) * 100)}% healthy</span>
          </div>
        </div>

        {/* Materials Inventory */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-blue-500" /> Materials Inventory
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Available',    val: data.materialsInventory.available,  bar: 'bg-green-500', text: 'text-green-700' },
              { label: 'Low Stock',    val: data.materialsInventory.lowStock,   bar: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Out of Stock', val: data.materialsInventory.outOfStock, bar: 'bg-red-500',   text: 'text-red-700' },
            ].map(({ label, val, bar, text }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold ${text}`}>{val} items</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${matTotal > 0 ? Math.round((val / matTotal) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <MiniStat label="Shortage Items"   value={data.shortages}     dot="bg-red-500"    text="text-red-600" />
            <MiniStat label="Pending Transfers" value={data.pendingTransfers ?? 0} dot="bg-sky-500" text="text-sky-600" />
            <MiniStat label="Open Maintenance"  value={data.openMaintenanceRequests ?? 0} dot="bg-yellow-500" text="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* ── Row 3: Request Tables ── */}
      <SectionTitle>Latest Requests</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              Operation Requests
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(data.operationRequestsOpen ?? 0) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {data.operationRequestsOpen ?? 0} open
              </span>
              <button title="Export Excel"
                onClick={() => downloadExport('/export/operation-requests/excel', `Mirsad_Operation_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
                className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-1">
            <RequestTable rows={data.latestOperationRequests ?? []} emptyLabel="No operation requests" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <Coffee className="h-4 w-4 text-purple-500" />
              Coffee Break Requests
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(data.coffeeBreakRequestsOpen ?? 0) > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                {data.coffeeBreakRequestsOpen ?? 0} open
              </span>
              <button title="Export Excel"
                onClick={() => downloadExport('/export/coffee-break-requests/excel', `Mirsad_Coffee_Break_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
                className="text-slate-400 hover:text-purple-600 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-1">
            <RequestTable rows={data.latestCoffeeBreakRequests ?? []} emptyLabel="No coffee break requests" />
          </div>
        </div>
      </div>

      {/* ── Row 4: Receiving + POs ── */}
      <SectionTitle>Receiving & Purchase Orders</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <ArrowDownToLine className="h-4 w-4 text-teal-500" />
              Recent Receiving
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{data.receivingToday ?? 0} today</span>
              <button title="Export Excel"
                onClick={() => downloadExport('/export/receiving/excel', `Mirsad_Receiving_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
                className="text-slate-400 hover:text-teal-600 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-1">
            <ReceivingTable rows={data.latestReceiving ?? []} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              Purchase Orders
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{data.openPurchaseOrders ?? 0} active</span>
              <button title="Export Excel"
                onClick={() => downloadExport('/export/purchase-orders/excel', `Mirsad_Purchase_Orders_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
                className="text-slate-400 hover:text-blue-600 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-1">
            <POTable rows={data.recentPurchaseOrders ?? []} />
          </div>
        </div>
      </div>

      {/* ── Row 5: Low Stock + Floor Check Approvals ── */}
      <SectionTitle>Stock Alerts & Approvals</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Low Stock Items
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(data.lowStock + data.outOfStock) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {data.lowStock + data.outOfStock} items
              </span>
              <button title="Export Excel"
                onClick={() => downloadExport('/export/inventory/excel', `Mirsad_Inventory_Report_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
                className="text-slate-400 hover:text-amber-600 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-1">
            <LowStockTable rows={data.lowStockItemsList ?? []} />
          </div>
        </div>

        {/* Floor Checks + Food Safety */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Floor Checks & Food Safety
          </h3>

          {/* Floor checks progress */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Today's Floor Checks</span>
              <span className="font-medium text-slate-700">
                {data.checks.total > 0 ? Math.round((data.checks.completed / data.checks.total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                style={{ width: `${data.checks.total > 0 ? Math.round((data.checks.completed / data.checks.total) * 100) : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-700">{data.checks.completed}</p>
                <p className="text-xs text-green-600">Done</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-lg font-bold text-amber-700">{data.checks.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-lg font-bold text-blue-700">{data.pendingApprovals}</p>
                <p className="text-xs text-blue-600">Approvals</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-0">
            <MiniStat label="Expiring in 3 Days"      value={data.expiringIn3Days ?? 0}          dot="bg-amber-400"  text="text-amber-600" />
            <MiniStat label="Active Spoilage Alerts"   value={data.activeSpoilageAlerts ?? 0}      dot="bg-red-500"    text="text-red-600" />
            <MiniStat label="Corrective Actions Open"  value={data.activeCorrectiveActions ?? 0}   dot="bg-orange-500" text="text-orange-600" />
            <MiniStat label="Fridge Checks Today"      value={data.fridgeChecksToday ?? 0}         dot="bg-blue-500"   text="text-blue-600" />
          </div>
        </div>
      </div>

      {/* ── Row 6: Analytics (optional) ── */}
      {(data.topConsumedItems?.length || data.checksByFloor?.length) ? (
        <>
          <SectionTitle>Analytics</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topConsumedItems?.length ? (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-orange-500" /> Top Consumed Items
                </h3>
                <div className="space-y-3">
                  {data.topConsumedItems.map((item, i) => {
                    const max = data.topConsumedItems![0].consumed;
                    const pct = max > 0 ? Math.round((item.consumed / max) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-4 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate max-w-[70%]">{item.name}</span>
                            <span className="font-semibold text-slate-900">{item.consumed}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  <BarChart2 className="h-4 w-4 text-indigo-500" /> Checks by Floor
                </h3>
                <div className="space-y-3">
                  {data.checksByFloor.map((floor, i) => {
                    const max = data.checksByFloor![0].count;
                    const pct = max > 0 ? Math.round((floor.count / max) * 100) : 0;
                    return (
                      <div key={floor.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-4 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate max-w-[70%]">{floor.name}</span>
                            <span className="font-semibold text-slate-900">{floor.count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
        </>
      ) : null}

      {/* ── Row 7: Recent Activity ── */}
      {data.recentActivity.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentActivity.slice(0, 8).map((rec: any) => (
              <div key={rec._id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {((rec.actor as any)?.fullName || 'S').split(' ').map((w: string) => w[0] || '').join('').toUpperCase().slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{(rec.actor as any)?.fullName || 'System'}</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-slate-500 capitalize">{rec.action} {rec.entityType?.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(parseISO(rec.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
