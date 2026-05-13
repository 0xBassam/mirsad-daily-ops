import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { DashboardStats, DashboardRequestRow, DashboardReceivingRow, DashboardPORow, DashboardLowStockRow } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { downloadExport } from '../../utils/downloadExport';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
import {
  ClipboardList, Coffee, Package, Warehouse, ShoppingCart,
  CheckCircle, TrendingDown, ArrowDownToLine, Bell,
  BarChart2, TrendingUp, Download, Flame, SlidersHorizontal,
  ChevronUp, ChevronDown as ChevronDownIcon, X,
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
  const { t } = useTranslation();
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {t(`status.${status}`, { defaultValue: status.replace(/_/g, ' ') })}
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
    <th className={`px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${className}`}>
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
      {onExport && !IS_DEMO && (
        <button onClick={onExport} title="Export" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function RequestTable({ rows, emptyLabel }: { rows: DashboardRequestRow[]; emptyLabel: string }) {
  const { t } = useTranslation();
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">{emptyLabel}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th className="w-[42%]">{t('common.request')}</Th>
            <Th>{t('common.floor')}</Th>
            <Th>{t('common.priority')}</Th>
            <Th>{t('common.status')}</Th>
            <Th>{t('common.time')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors last:border-0">
              <td className="py-3 px-4">
                <p className="font-semibold text-slate-800 truncate max-w-[220px]" title={r.title}>{r.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.itemCount} {t('dashboard.itemsCount')}</p>
              </td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{r.floor}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[r.priority] ?? 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-600">{t(`status.${r.priority}`, { defaultValue: r.priority })}</span>
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
  const { t } = useTranslation();
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">{t('dashboard.noReceiving')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>{t('common.supplier')}</Th>
            <Th>{t('common.date')}</Th>
            <Th>{t('clientRequests.requestedItems')}</Th>
            <Th>{t('common.invoice')}</Th>
            <Th>{t('common.status')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-b border-slate-50 hover:bg-teal-50/30 transition-colors last:border-0">
              <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate" title={r.supplierName}>{r.supplierName}</td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{format(parseISO(r.deliveryDate), 'dd MMM yyyy')}</td>
              <td className="py-3 px-4 text-slate-600">{r.lineCount} {t('dashboard.itemsCount')}</td>
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
  const { t } = useTranslation();
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">{t('dashboard.noPOs')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>{t('purchaseOrders.poNumber')}</Th>
            <Th>{t('common.supplier')}</Th>
            <Th>{t('purchaseOrders.month')}</Th>
            <Th>{t('common.received')}</Th>
            <Th>{t('common.status')}</Th>
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
  const { t } = useTranslation();
  if (!rows.length) return <p className="text-sm text-slate-400 py-6 text-center">{t('dashboard.allStocked')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>{t('common.item')}</Th>
            <Th>{t('common.type')}</Th>
            <Th>{t('common.remaining')}</Th>
            <Th>{t('common.limit')}</Th>
            <Th>{t('common.status')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors last:border-0">
              <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === 'food' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {t(`status.${r.type}`, { defaultValue: r.type })}
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

// ─── Client-only dashboard ────────────────────────────────────────────────────
const CR_STATUS_COLORS: Record<string, string> = {
  submitted:   'bg-amber-100  text-amber-700',
  assigned:    'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-blue-100   text-blue-700',
  delivered:   'bg-violet-100 text-violet-700',
  confirmed:   'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100    text-red-700',
};

type WidgetId = 'stats' | 'awaiting' | 'upcoming' | 'active' | 'bytype' | 'history';
interface WidgetDef { id: WidgetId; labelKey: string; }
const ALL_WIDGETS: WidgetDef[] = [
  { id: 'stats',   labelKey: 'dashboard.widgets.stats' },
  { id: 'awaiting',labelKey: 'dashboard.widgets.awaiting' },
  { id: 'upcoming',labelKey: 'clientRequests.upcomingServices' },
  { id: 'active',  labelKey: 'dashboard.widgets.active' },
  { id: 'bytype',  labelKey: 'clientRequests.byType' },
  { id: 'history', labelKey: 'dashboard.widgets.history' },
];
const DATE_RANGES = [7, 14, 30, 0] as const;

function loadLayout(userId: string): { order: WidgetId[]; hidden: WidgetId[] } {
  try {
    const raw = localStorage.getItem(`clientDash:${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // ensure new widget ids are present (migration for existing stored layouts)
      const allIds = ALL_WIDGETS.map(w => w.id);
      const missing = allIds.filter(id => !parsed.order.includes(id));
      if (missing.length) parsed.order = [...parsed.order, ...missing];
      return parsed;
    }
  } catch { /* ignore */ }
  return { order: ALL_WIDGETS.map(w => w.id), hidden: [] };
}

function saveLayout(userId: string, order: WidgetId[], hidden: WidgetId[]) {
  try { localStorage.setItem(`clientDash:${userId}`, JSON.stringify({ order, hidden })); } catch { /* ignore */ }
}

function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?._id ?? 'guest';

  const [dateRange, setDateRange] = useState<0 | 7 | 14 | 30>(7);
  const [showCustomize, setShowCustomize] = useState(false);
  const [layout, setLayout] = useState(() => loadLayout(userId));

  const { order, hidden } = layout;

  const { data, isLoading } = useQuery({
    queryKey: ['client-requests'],
    queryFn: () => apiClient.get('/client-requests', { params: { limit: 100 } }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const toggleWidget = useCallback((id: WidgetId) => {
    setLayout(prev => {
      const newHidden = prev.hidden.includes(id)
        ? prev.hidden.filter(h => h !== id)
        : [...prev.hidden, id];
      saveLayout(userId, prev.order, newHidden);
      return { ...prev, hidden: newHidden };
    });
  }, [userId]);

  const moveWidget = useCallback((id: WidgetId, dir: -1 | 1) => {
    setLayout(prev => {
      const idx = prev.order.indexOf(id);
      const newOrder = [...prev.order];
      const swap = idx + dir;
      if (swap < 0 || swap >= newOrder.length) return prev;
      [newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]];
      saveLayout(userId, newOrder, prev.hidden);
      return { ...prev, order: newOrder };
    });
  }, [userId]);

  if (isLoading) return <PageLoader />;

  const now = Date.now();
  const cutoff = dateRange > 0 ? now - dateRange * 86_400_000 : 0;
  const all: any[] = (data?.data ?? []).filter((r: any) =>
    cutoff === 0 || new Date(r.createdAt).getTime() >= cutoff
  );

  const active    = all.filter(r => ['submitted','assigned','in_progress'].includes(r.status));
  const delivered = all.filter(r => r.status === 'delivered');
  const history   = all.filter(r => ['confirmed','rejected'].includes(r.status)).slice(0, 5);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = (data?.data ?? [])
    .filter((r: any) => r.scheduledDate && r.scheduledDate.slice(0, 10) >= todayStr && !['confirmed','rejected'].includes(r.status))
    .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);

  const byType: Record<string, number> = {};
  for (const r of all) {
    byType[r.requestType] = (byType[r.requestType] ?? 0) + 1;
  }
  const byTypeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  function RequestCard({ req }: { req: any }) {
    const statusColor = CR_STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-600';
    return (
      <Link to={`/client-requests/${req._id}`} className="block bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-semibold text-slate-800 text-sm leading-snug">{req.title}</p>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0 ${statusColor}`}>
            {t(`status.${req.status}`, { defaultValue: req.status.replace(/_/g, ' ') })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{t(`clientRequests.types.${req.requestType}`, { defaultValue: req.requestType.replace(/_/g, ' ') })}</span>
          {req.floor && <><span>·</span><span>{typeof req.floor === 'object' ? req.floor.name : req.floor}</span></>}
          <span>·</span>
          <span>{formatDistanceToNow(parseISO(req.createdAt), { addSuffix: true })}</span>
        </div>
        {req.items?.length > 0 && (
          <p className="text-xs text-slate-400 mt-1.5">{req.items.length} {t('dashboard.itemsCount')}</p>
        )}
      </Link>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    operation_request:    'bg-indigo-100 text-indigo-700',
    coffee_break_request: 'bg-purple-100 text-purple-700',
    catering:             'bg-orange-100 text-orange-700',
    maintenance:          'bg-slate-100  text-slate-700',
    supplies:             'bg-blue-100   text-blue-700',
    event:                'bg-pink-100   text-pink-700',
    housekeeping:         'bg-teal-100   text-teal-700',
    other:                'bg-gray-100   text-gray-600',
  };

  const widgetMap: Record<WidgetId, React.ReactNode> = {
    stats: (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('clientRequests.total'),               value: all.length,       color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: t('clientRequests.active'),              value: active.length,    color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
          { label: t('clientRequests.awaitingConfirmation'), value: delivered.length, color: 'bg-violet-50 border-violet-200 text-violet-700' },
          { label: t('dashboard.completed'),                 value: history.length,   color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-3xl font-extrabold tabular-nums">{s.value}</p>
            <p className="text-xs font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    ),
    upcoming: (
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {t('clientRequests.upcomingServices')} {upcoming.length > 0 && `(${upcoming.length})`}
        </h2>
        {upcoming.length === 0
          ? <p className="text-slate-400 text-sm py-4 text-center">{t('clientRequests.noUpcoming')}</p>
          : (
            <div className="space-y-2">
              {upcoming.map((r: any) => (
                <Link key={r._id} to={`/client-requests/${r._id}`}
                  className="flex items-start justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3.5 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t(`clientRequests.types.${r.requestType}`, { defaultValue: r.requestType.replace(/_/g, ' ') })}
                      {r.employeeName && <> · {r.employeeName}</>}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0 ms-3">
                    <p className="text-xs font-bold text-indigo-600">{format(parseISO(r.scheduledDate), 'dd MMM')}</p>
                    {r.scheduledTime && <p className="text-xs text-slate-400">{r.scheduledTime}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </div>
    ),
    bytype: byTypeEntries.length > 0 ? (
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.byType')}</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {byTypeEntries.map(([type, count]) => {
            const maxCount = byTypeEntries[0][1];
            const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
            return (
              <div key={type} className="px-4 py-3 border-b border-slate-50 last:border-0 flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-36 text-center flex-shrink-0 ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t(`clientRequests.types.${type}`, { defaultValue: type.replace(/_/g, ' ') })}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 tabular-nums w-5 text-end">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    ) : null,
    awaiting: delivered.length > 0 ? (
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {t('clientRequests.awaitingConfirmation')} ({delivered.length})
        </h2>
        <div className="space-y-2">
          {delivered.map(r => (
            <Link key={r._id} to={`/client-requests/${r._id}`}
              className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-2xl px-5 py-4 hover:bg-violet-100 transition-colors">
              <div>
                <p className="font-semibold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(`clientRequests.types.${r.requestType}`, { defaultValue: r.requestType.replace(/_/g, ' ') })}
                  {r.deliveredAt && <> · {t('clientRequests.deliveredAgo')} {formatDistanceToNow(parseISO(r.deliveredAt), { addSuffix: true })}</>}
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-violet-600 text-white">{t('clientRequests.confirmArrow')}</span>
            </Link>
          ))}
        </div>
      </div>
    ) : null,
    active: (
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {t('clientRequests.activeRequests')} ({active.length})
        </h2>
        {active.length === 0
          ? <p className="text-slate-400 text-sm py-4 text-center">{t('clientRequests.noActiveRequests')}</p>
          : <div className="space-y-2">{active.map(r => <RequestCard key={r._id} req={r} />)}</div>
        }
      </div>
    ),
    history: history.length > 0 ? (
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('clientRequests.recentHistory')}</h2>
        <div className="space-y-2">{history.map(r => <RequestCard key={r._id} req={r} />)}</div>
      </div>
    ) : null,
  };

  const visibleOrder = order.filter(id => !hidden.includes(id));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('clientRequests.myRequests')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowCustomize(p => !p)}
            className={`p-2 rounded-lg border transition-colors ${showCustomize ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
            title={t('dashboard.customize')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <Link to="/client-requests/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            + {t('clientRequests.newRequest')}
          </Link>
        </div>
      </div>

      {/* Customize panel */}
      {showCustomize && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{t('dashboard.customizeLayout')}</p>
            <button onClick={() => setShowCustomize(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">{t('dashboard.dateRange')}</p>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map(d => (
                <button
                  key={d}
                  onClick={() => setDateRange(d as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${dateRange === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}
                >
                  {d === 0 ? t('dashboard.allTime') : t('dashboard.lastNDays', { count: d })}
                </button>
              ))}
            </div>
          </div>

          {/* Widget toggles + reorder */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">{t('dashboard.widgets.label')}</p>
            <div className="space-y-1.5">
              {order.map((id, idx) => {
                const def = ALL_WIDGETS.find(w => w.id === id)!;
                const isVisible = !hidden.includes(id);
                return (
                  <div key={id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isVisible}
                        onChange={() => toggleWidget(id)}
                      />
                      <span className="text-sm text-slate-700">{t(def.labelKey)}</span>
                    </label>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveWidget(id, -1)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveWidget(id, 1)} disabled={idx === order.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Widgets in order */}
      {visibleOrder.map(id => {
        const node = widgetMap[id];
        return node ? <div key={id}>{node}</div> : null;
      })}

      <div className="text-center pt-2">
        <Link to="/client-requests" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          {t('clientRequests.viewAll')} →
        </Link>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isClient = user?.role === 'client';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
    enabled: !isClient,
  });

  if (isClient) return <ClientDashboard />;
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
              Ministry of Energy · Kingdom of Saudi Arabia
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-indigo-200/80 text-sm mt-1.5">
              {t('dashboard.cafeteriaOps')} ·{' '}
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 flex-shrink-0">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">{t('dashboard.system')}</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-sm font-semibold text-white">{t('dashboard.systemLive')}</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/10 pointer-events-none" />
      </div>

      {/* ── KPI Row ── */}
      <div className="space-y-3">
        <SectionHeader>{t('dashboard.todayOps')}</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <KpiCard icon={ClipboardList}   label={t('dashboard.operationRequests')}  value={data.operationRequestsOpen ?? 0}                    bg="bg-indigo-500" accent="text-indigo-600" highlight />
          <KpiCard icon={Coffee}          label={t('dashboard.coffeeBreakRequests')} value={data.coffeeBreakRequestsOpen ?? 0}                   bg="bg-purple-500" accent="text-purple-600" highlight />
          <KpiCard icon={ArrowDownToLine} label={t('dashboard.receivingToday')}      value={data.receivingToday ?? 0}                           bg="bg-teal-500"   accent="text-teal-600" />
          <KpiCard icon={ShoppingCart}    label={t('dashboard.activePOs')}           value={data.openPurchaseOrders ?? 0}                       bg="bg-blue-500"   accent="text-blue-600" />
          <KpiCard icon={Flame}           label={t('dashboard.todayConsumptionKpi')} value={(data as any).todayConsumption?.qty ?? 0}            bg="bg-orange-500" accent="text-orange-600" />
          <KpiCard icon={TrendingDown}    label={t('dashboard.lowOutOfStock')}       value={(data.lowStock ?? 0) + (data.outOfStock ?? 0)}       bg="bg-amber-500"  accent="text-amber-600" highlight />
          <KpiCard icon={Bell}            label={t('dashboard.activeAlerts')}        value={totalAlerts}                                        bg="bg-red-500"    accent="text-red-600"  highlight />
        </div>
      </div>

      {/* ── Inventory Health ── */}
      <div className="space-y-3">
        <SectionHeader>{t('dashboard.inventoryStatus')} — {new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })}</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Food Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-green-500"><Package className="h-4 w-4 text-white" /></div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{t('dashboard.foodInventoryTitle')}</h3>
                <p className="text-xs text-slate-400">{foodTotal} {t('dashboard.categoriesTracked')}</p>
              </div>
              <div className="ms-auto text-right">
                <span className="text-2xl font-bold text-green-600">{Math.round(data.foodInventory.available / Math.max(1, foodTotal) * 100)}%</span>
                <p className="text-xs text-slate-400">{t('dashboard.healthy')}</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {[
                { label: t('status.available'),     val: data.foodInventory.available,    bar: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: t('status.low_stock'),      val: data.foodInventory.lowStock,     bar: 'bg-amber-500',   text: 'text-amber-700' },
                { label: t('status.out_of_stock'),   val: data.foodInventory.outOfStock,   bar: 'bg-red-500',     text: 'text-red-700' },
                { label: t('status.over_consumed'),  val: data.foodInventory.overConsumed, bar: 'bg-red-700',     text: 'text-red-800' },
              ].map(({ label, val, bar, text }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${text}`}>{val} {t('dashboard.itemsCount')}</span>
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
                <h3 className="font-semibold text-slate-800 text-sm">{t('dashboard.materialsInventoryTitle')}</h3>
                <p className="text-xs text-slate-400">{matTotal} {t('dashboard.categoriesTracked')}</p>
              </div>
              <div className="ms-auto text-right">
                <span className="text-2xl font-bold text-blue-600">{Math.round(data.materialsInventory.available / Math.max(1, matTotal) * 100)}%</span>
                <p className="text-xs text-slate-400">{t('dashboard.availablePct')}</p>
              </div>
            </div>
            <div className="space-y-3.5 mb-5">
              {[
                { label: t('status.available'),   val: data.materialsInventory.available,  bar: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: t('status.low_stock'),    val: data.materialsInventory.lowStock,   bar: 'bg-amber-500',   text: 'text-amber-700' },
                { label: t('status.out_of_stock'), val: data.materialsInventory.outOfStock, bar: 'bg-red-500',     text: 'text-red-700' },
              ].map(({ label, val, bar, text }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${text}`}>{val} {t('dashboard.itemsCount')}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${matTotal > 0 ? Math.round((val / matTotal) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-0">
              <MiniStat label={t('dashboard.shortageItems')}         value={data.shortages}                    dot="bg-red-500"    text="text-red-600" />
              <MiniStat label={t('dashboard.pendingTransfers')}       value={data.pendingTransfers ?? 0}        dot="bg-sky-500"    text="text-sky-600" />
              <MiniStat label={t('dashboard.openMaintenance')}        value={data.openMaintenanceRequests ?? 0} dot="bg-yellow-500" text="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Latest Requests ── */}
      <div className="space-y-3">
        <SectionHeader>{t('dashboard.latestRequests')}</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ClipboardList} title={t('dashboard.operationRequests')} iconBg="bg-indigo-500"
              badge={data.operationRequestsOpen ?? 0} badgeColor="bg-indigo-100 text-indigo-700"
              onExport={() => downloadExport('/export/operation-requests/excel', `Mirsad_Operation_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <RequestTable rows={data.latestOperationRequests ?? []} emptyLabel={t('dashboard.noOpRequests')} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={Coffee} title={t('dashboard.coffeeBreakRequests')} iconBg="bg-purple-500"
              badge={data.coffeeBreakRequestsOpen ?? 0} badgeColor="bg-purple-100 text-purple-700"
              onExport={() => downloadExport('/export/coffee-break-requests/excel', `Mirsad_Coffee_Break_Requests_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <RequestTable rows={data.latestCoffeeBreakRequests ?? []} emptyLabel={t('dashboard.noCbRequests')} />
          </div>
        </div>
      </div>

      {/* ── Receiving & POs ── */}
      <div className="space-y-3">
        <SectionHeader>{t('dashboard.receivingAndPOs')}</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ArrowDownToLine} title={t('dashboard.recentReceiving')} iconBg="bg-teal-500"
              badge={data.receivingToday ?? 0} badgeColor="bg-teal-100 text-teal-700"
              onExport={() => downloadExport('/export/receiving/excel', `Mirsad_Receiving_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <ReceivingTable rows={data.latestReceiving ?? []} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={ShoppingCart} title={t('dashboard.purchaseOrdersTitle')} iconBg="bg-blue-500"
              badge={data.openPurchaseOrders ?? 0} badgeColor="bg-blue-100 text-blue-700"
              onExport={() => downloadExport('/export/purchase-orders/excel', `Mirsad_Purchase_Orders_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <POTable rows={data.recentPurchaseOrders ?? []} />
          </div>
        </div>
      </div>

      {/* ── Stock Alerts & Floor Safety ── */}
      <div className="space-y-3">
        <SectionHeader>{t('dashboard.stockAlerts')}</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader
              icon={TrendingDown} title={t('dashboard.lowStockItemsTitle')} iconBg="bg-amber-500"
              badge={(data.lowStock + data.outOfStock)} badgeColor="bg-amber-100 text-amber-700"
              onExport={() => downloadExport('/export/inventory/excel', `Mirsad_Inventory_Report_${new Date().toISOString().slice(0,10)}.xlsx`).catch(() => toast.error('Export failed'))}
            />
            <LowStockTable rows={data.lowStockItemsList ?? []} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500"><CheckCircle className="h-4 w-4 text-white" /></div>
              <h3 className="font-semibold text-slate-800 text-sm">{t('dashboard.floorChecksSafety')}</h3>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-500">{t('dashboard.todayCompletion')}</span>
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
                  { val: data.checks.completed, label: t('dashboard.done'),         color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
                  { val: data.checks.pending,   label: t('dashboard.pending'),       color: 'bg-amber-50 text-amber-700 border border-amber-100' },
                  { val: data.pendingApprovals, label: t('dashboard.approvalsCount'), color: 'bg-blue-50 text-blue-700 border border-blue-100' },
                ].map(({ val, label, color }) => (
                  <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                    <p className="text-xl font-bold tabular-nums">{val}</p>
                    <p className="text-xs font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2 space-y-0">
              <MiniStat label={t('dashboard.expiringIn3Days')}         value={data.expiringIn3Days ?? 0}        dot="bg-amber-400"  text="text-amber-600" />
              <MiniStat label={t('dashboard.activeSpoilageAlerts')}    value={data.activeSpoilageAlerts ?? 0}   dot="bg-red-500"    text="text-red-600" />
              <MiniStat label={t('dashboard.activeCorrectiveActions')}  value={data.activeCorrectiveActions ?? 0} dot="bg-orange-500" text="text-orange-600" />
              <MiniStat label={t('dashboard.fridgeChecksToday')}        value={data.fridgeChecksToday ?? 0}      dot="bg-blue-500"   text="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics ── */}
      {(data.topConsumedItems?.length || data.checksByFloor?.length) ? (
        <div className="space-y-3">
          <SectionHeader>{t('dashboard.analyticsInsights')}</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topConsumedItems?.length ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500"><TrendingUp className="h-4 w-4 text-white" /></div>
                  <h3 className="font-semibold text-slate-800 text-sm">{t('dashboard.topConsumedItems')}</h3>
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
                  <h3 className="font-semibold text-slate-800 text-sm">{t('dashboard.checksByFloor')}</h3>
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
          <SectionHeader>{t('dashboard.recentActivityTitle')}</SectionHeader>
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
