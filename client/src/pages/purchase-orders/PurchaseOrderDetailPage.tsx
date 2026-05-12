import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Calendar, Package, TrendingDown, TrendingUp, AlertTriangle, ArrowDownToLine } from 'lucide-react';
import apiClient from '../../api/client';
import { PurchaseOrder, POLine, POStatus } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

function BalanceBar({ approved, distributed, consumed, remaining }: { approved: number; distributed: number; consumed: number; remaining: number }) {
  const usedPct  = Math.min(100, approved > 0 ? ((distributed + consumed) / approved) * 100 : 0);
  const isOver   = remaining < 0;
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{distributed + consumed} / {approved} {isOver && <span className="text-red-600 font-semibold ms-1">▲ over</span>}</span>
        <span className={remaining < 0 ? 'text-red-600 font-semibold' : remaining / approved < 0.15 ? 'text-amber-600 font-semibold' : 'text-green-700'}>
          {remaining >= 0 ? remaining : Math.abs(remaining)} {remaining < 0 ? 'over' : 'left'}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : usedPct > 85 ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${Math.min(100, usedPct)}%` }}
        />
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<POStatus, string> = {
  active:             'bg-blue-100 text-blue-800',
  partially_received: 'bg-indigo-100 text-indigo-800',
  fully_received:     'bg-green-100 text-green-800',
  near_depletion:     'bg-amber-100 text-amber-800',
  over_consumed:      'bg-red-100 text-red-800',
  closed:             'bg-slate-100 text-slate-600',
};

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => apiClient.get(`/purchase-orders/${id}`).then(r => r.data.data as PurchaseOrder),
  });

  const receiveMutation = useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      apiClient.post(`/purchase-orders/${id}/lines/${lineId}/receive`, { quantity }),
    onSuccess: (_, { lineId }) => {
      toast.success('Stock received and inventory updated');
      setReceiveQtys(prev => ({ ...prev, [lineId]: '' }));
      qc.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Receive failed'),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="p-6 text-slate-500">{t('common.notFound')}</div>;

  const po = data;
  const supplier = po.supplier as any;
  const project  = po.project as any;

  const totalApproved    = po.lines.reduce((s, l) => s + l.approvedQty, 0);
  const totalDistributed = po.lines.reduce((s, l) => s + l.distributedQty + l.consumedQty, 0);
  const totalRemaining   = po.lines.reduce((s, l) => s + l.remainingQty, 0);
  const overLines        = po.lines.filter(l => l.remainingQty < 0).length;
  const nearLines        = po.lines.filter(l => l.remainingQty >= 0 && l.approvedQty > 0 && l.remainingQty / l.approvedQty < 0.15).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{po.poNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[po.status]}`}>
              {t(`status.${po.status}`)}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{po.notes}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium">{t('common.supplier')}</p>
            <p className="text-sm font-semibold text-slate-900">{supplier?.name || '—'}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Package className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium">{t('common.project')}</p>
            <p className="text-sm font-semibold text-slate-900">{project?.name || '—'}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium">{t('purchaseOrders.period')}</p>
            <p className="text-sm font-semibold text-slate-900">
              {format(new Date(po.startDate), 'dd MMM')} – {format(new Date(po.endDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase font-medium">{t('purchaseOrders.totalBalance')}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalRemaining.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{t('purchaseOrders.of')} {totalApproved.toLocaleString()} {t('purchaseOrders.approved')}</p>
        </div>
      </div>

      {/* Alert banners */}
      {overLines > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <TrendingUp className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{overLines} {t('purchaseOrders.linesOverConsumed')}</p>
        </div>
      )}
      {nearLines > 0 && overLines === 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{nearLines} {t('purchaseOrders.linesNearDepletion')}</p>
        </div>
      )}

      {/* PO Lines */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800 text-sm">{t('purchaseOrders.lineItems')} ({po.lines.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {po.lines.map((line: POLine) => {
            const item = line.item as any;
            const isOver = line.remainingQty < 0;
            const isNear = !isOver && line.approvedQty > 0 && line.remainingQty / line.approvedQty < 0.15;
            return (
              <div key={line._id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{item?.name || '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item?.type === 'food' ? '🍽' : '📦'} {item?.unit || line.unit}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    {isOver  && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{t('purchaseOrders.overConsumed')}</span>}
                    {isNear  && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{t('purchaseOrders.nearDepletion')}</span>}
                    {!isOver && !isNear && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t('status.active')}</span>}
                  </div>
                </div>

                <BalanceBar
                  approved={line.approvedQty}
                  distributed={line.distributedQty}
                  consumed={line.consumedQty}
                  remaining={line.remainingQty}
                />

                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  {[
                    { label: t('purchaseOrders.approved'),    value: line.approvedQty,    color: 'text-slate-600' },
                    { label: t('purchaseOrders.received'),    value: line.receivedQty,    color: 'text-blue-600' },
                    { label: t('purchaseOrders.distributed'), value: line.distributedQty, color: 'text-orange-600' },
                    { label: t('purchaseOrders.consumed'),    value: line.consumedQty,    color: 'text-purple-600' },
                    { label: t('purchaseOrders.remaining'),   value: line.remainingQty,   color: isOver ? 'text-red-600 font-bold' : isNear ? 'text-amber-600 font-bold' : 'text-green-700 font-bold' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-slate-400 mb-0.5">{label}</p>
                      <p className={`text-base font-semibold ${color}`}>{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Receive stock action */}
                {po.status !== 'closed' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number" min="1"
                      placeholder="Qty to receive"
                      className="input w-36 text-sm"
                      value={receiveQtys[line._id] || ''}
                      onChange={e => setReceiveQtys(prev => ({ ...prev, [line._id]: e.target.value }))}
                    />
                    <button
                      className="btn-primary text-sm flex items-center gap-1.5"
                      disabled={!receiveQtys[line._id] || Number(receiveQtys[line._id]) <= 0 || receiveMutation.isPending}
                      onClick={() => receiveMutation.mutate({ lineId: line._id, quantity: Number(receiveQtys[line._id]) })}
                    >
                      <ArrowDownToLine className="h-4 w-4" /> Receive
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
