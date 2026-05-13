import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Plus, CheckCircle2, CalendarDays, Clock,
  TrendingUp, BarChart2, MapPin, Package, AlertTriangle,
  ChevronRight, Layers,
} from 'lucide-react';
import apiClient from '../../api/client';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientDashData {
  branding:    { clientName: string; clientLogoUrl: string; clientSiteName: string; clientDepartment: string };
  stats:       { total: number; active: number; submitted: number; assigned: number; in_progress: number; delivered: number; confirmed: number; rejected: number };
  byType:      { type: string; count: number }[];
  byFloor:     { floor: string; count: number }[];
  upcoming:    any[];
  awaitingConfirmation: any[];
  recentActivity:       any[];
  monthlyTrend:  { month: string; count: number }[];
  stockSummary:  { available: number; lowStock: number; outOfStock: number; overConsumed: number };
}

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  submitted:   'bg-amber-100 text-amber-700',
  assigned:    'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-blue-100 text-blue-700',
  delivered:   'bg-violet-100 text-violet-700',
  confirmed:   'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
};

const TYPE_COLOR: Record<string, string> = {
  operation_request:    'bg-indigo-500',
  coffee_break_request: 'bg-purple-500',
  catering:             'bg-orange-500',
  maintenance:          'bg-slate-500',
  supplies:             'bg-blue-500',
  event:                'bg-pink-500',
  housekeeping:         'bg-teal-500',
  other:                'bg-gray-400',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, colorClass }: { label: string; value: number; sub?: string; colorClass: string }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${colorClass}`}>
      <p className="text-3xl font-extrabold tabular-nums leading-none">{value}</p>
      <div>
        <p className="text-xs font-bold">{label}</p>
        {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, linkTo, linkLabel }: {
  icon: React.ElementType; title: string; count?: number; linkTo?: string; linkLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h2>
      {count !== undefined && (
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
      )}
      {linkTo && (
        <Link to={linkTo} className="ms-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5">
          {linkLabel} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-36 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 tabular-nums w-5 text-end">{value}</span>
    </div>
  );
}

function VBar({ month, count, max }: { month: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-xs font-bold text-slate-700 tabular-nums">{count > 0 ? count : ''}</span>
      <div className="w-full flex-1 bg-slate-100 rounded-t-md overflow-hidden flex items-end">
        <div
          className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
          style={{ height: `${pct}%`, minHeight: count > 0 ? '4px' : '0' }}
        />
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{month}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientDashboardPage() {
  const { t }   = useTranslation();
  const { user } = useAuth();
  const qc      = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: ClientDashData }>({
    queryKey: ['client-dashboard'],
    queryFn: () => apiClient.get('/client-dashboard').then(r => r.data),
    refetchInterval: 60_000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/client-requests/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-dashboard'] });
      qc.invalidateQueries({ queryKey: ['client-requests'] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (!data?.data) return null;

  const d = data.data;
  const { branding, stats, byType, byFloor, upcoming, awaitingConfirmation, recentActivity, monthlyTrend, stockSummary } = d;

  const maxType  = byType[0]?.count   || 1;
  const maxFloor = byFloor[0]?.count  || 1;
  const maxTrend = Math.max(...monthlyTrend.map(m => m.count), 1);
  const hasStock = stockSummary.available + stockSummary.lowStock + stockSummary.outOfStock > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Branding Header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {branding.clientLogoUrl ? (
              <img
                src={branding.clientLogoUrl}
                alt="Client logo"
                className="h-12 w-12 rounded-xl object-contain bg-white/10 p-1.5 flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">M</span>
              </div>
            )}
            <div>
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-0.5">
                {t('clientDashboard.title')}
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {branding.clientName || user?.fullName || t('clientDashboard.welcome')}
              </h1>
              {(branding.clientSiteName || branding.clientDepartment) && (
                <p className="text-indigo-300 text-sm mt-0.5">
                  {[branding.clientSiteName, branding.clientDepartment].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <div className="text-end flex-shrink-0">
            <p className="text-indigo-300 text-xs font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <Link
              to="/client-requests/new"
              className="mt-2 inline-flex items-center gap-1.5 bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('clientDashboard.newRequest')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label={t('clientDashboard.kpiTotal')}     value={stats.total}     colorClass="bg-slate-50 border-slate-200 text-slate-700" />
        <KpiCard label={t('clientDashboard.kpiActive')}    value={stats.active}    colorClass="bg-indigo-50 border-indigo-200 text-indigo-700" />
        <KpiCard label={t('clientDashboard.kpiPending')}   value={stats.submitted} colorClass="bg-amber-50 border-amber-200 text-amber-700" />
        <KpiCard label={t('clientDashboard.kpiAwaiting')}  value={stats.delivered} colorClass="bg-violet-50 border-violet-200 text-violet-700" />
        <KpiCard label={t('clientDashboard.kpiCompleted')} value={stats.confirmed} colorClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
      </div>

      {/* ── Confirmation Action Banner ── */}
      {awaitingConfirmation.length > 0 && (
        <div className="bg-violet-600 text-white rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">
                {awaitingConfirmation.length === 1
                  ? t('clientDashboard.confirmBannerSingular')
                  : t('clientDashboard.confirmBanner', { count: awaitingConfirmation.length })}
              </p>
              <p className="text-violet-200 text-xs mt-0.5">{t('clientDashboard.confirmBannerHint')}</p>
            </div>
          </div>
          <Link
            to="/client-requests?status=delivered"
            className="bg-white text-violet-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {t('clientDashboard.confirmNow')} →
          </Link>
        </div>
      )}

      {/* ── Upcoming + Awaiting 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming Scheduled Services */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={CalendarDays} title={t('clientDashboard.upcomingServices')} count={upcoming.length} linkTo="/client-requests" linkLabel={t('common.viewAll')} />
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('clientDashboard.noUpcoming')}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((r: any) => (
                <Link
                  key={r._id}
                  to={`/client-requests/${r._id}`}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t(`clientRequests.types.${r.requestType}`, { defaultValue: r.requestType })}
                      {(r.floor as any)?.name && <> · {(r.floor as any).name}</>}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-xs font-bold text-indigo-600">{format(parseISO(r.scheduledDate), 'dd MMM')}</p>
                    {r.scheduledTime && <p className="text-xs text-slate-400">{r.scheduledTime}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Confirmations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={CheckCircle2} title={t('clientDashboard.pendingConfirmations')} count={awaitingConfirmation.length} />
          {awaitingConfirmation.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('clientDashboard.noPending')}</p>
          ) : (
            <div className="space-y-2">
              {awaitingConfirmation.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('clientDashboard.deliveredOn')} {r.deliveredAt ? formatDistanceToNow(parseISO(r.deliveredAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  <button
                    className="text-xs font-bold px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-60"
                    disabled={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate(r._id)}
                  >
                    {t('clientDashboard.confirmDelivery')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Trend + By Type 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={TrendingUp} title={t('clientDashboard.monthlyTrend')} />
          <div className="flex items-end gap-1.5 h-32 mt-2">
            {monthlyTrend.map(m => (
              <VBar key={m.month} month={m.month} count={m.count} max={maxTrend} />
            ))}
          </div>
        </div>

        {/* By Service Type */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={BarChart2} title={t('clientDashboard.byType')} />
          {byType.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3 mt-1">
              {byType.map(b => (
                <HBar
                  key={b.type}
                  label={t(`clientRequests.types.${b.type}`, { defaultValue: b.type })}
                  value={b.count}
                  max={maxType}
                  color={TYPE_COLOR[b.type] ?? 'bg-indigo-500'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── By Status + By Floor 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* By Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={Layers} title={t('clientDashboard.byStatus')} />
          <div className="space-y-2 mt-1">
            {(['submitted','in_progress','delivered','confirmed','rejected'] as const).map(s => {
              const count = stats[s] || 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-32 text-center flex-shrink-0 ${STATUS_COLOR[s] ?? 'bg-slate-100 text-slate-600'}`}>
                    {t(`status.${s}`)}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s === 'confirmed' ? 'bg-emerald-500' : s === 'rejected' ? 'bg-red-500' : s === 'delivered' ? 'bg-violet-500' : s === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums w-5 text-end">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Floor / Location */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={MapPin} title={t('clientDashboard.byFloor')} />
          {byFloor.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3 mt-1">
              {byFloor.map(f => (
                <HBar key={f.floor} label={f.floor} value={f.count} max={maxFloor} color="bg-teal-500" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stock / Service Availability ── */}
      {hasStock && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={Package} title={t('clientDashboard.stockOverview')} />
          <p className="text-xs text-slate-400 mb-4">{t('clientDashboard.stockHint')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('clientDashboard.stockAvailable'),    value: stockSummary.available,    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
              { label: t('clientDashboard.stockLow'),          value: stockSummary.lowStock,     bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-500' },
              { label: t('clientDashboard.stockOut'),          value: stockSummary.outOfStock,   bg: 'bg-red-50 border-red-200',        text: 'text-red-700',     dot: 'bg-red-500' },
              { label: t('clientDashboard.stockOverConsumed'), value: stockSummary.overConsumed, bg: 'bg-orange-50 border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-500' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border rounded-xl p-3 text-center`}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                  <p className={`text-xs font-semibold ${c.text}`}>{c.label}</p>
                </div>
                <p className={`text-2xl font-extrabold tabular-nums ${c.text}`}>{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('common.items')}</p>
              </div>
            ))}
          </div>
          {(stockSummary.outOfStock > 0 || stockSummary.lowStock > 0) && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {t('clientDashboard.stockWarning', { low: stockSummary.lowStock, out: stockSummary.outOfStock })}
            </div>
          )}
        </div>
      )}

      {/* ── Recent Activity ── */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeader icon={Clock} title={t('clientDashboard.recentActivity')} linkTo="/client-requests" linkLabel={t('clientDashboard.viewAllRequests')} />
          <div className="space-y-2">
            {recentActivity.map((r: any) => (
              <Link key={r._id} to={`/client-requests/${r._id}`}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t(`clientRequests.types.${r.requestType}`, { defaultValue: r.requestType })}
                    {' · '}
                    {r.updatedAt ? formatDistanceToNow(parseISO(r.updatedAt), { addSuffix: true }) : ''}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {t(`status.${r.status}`)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions Footer ── */}
      <div className="flex items-center justify-between pb-4">
        <Link to="/client-requests" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors">
          <MessageSquare className="h-4 w-4" />
          {t('clientDashboard.viewAllRequests')}
        </Link>
        <Link to="/client-requests/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          {t('clientDashboard.newRequest')}
        </Link>
      </div>
    </div>
  );
}
