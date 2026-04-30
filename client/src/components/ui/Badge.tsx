import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'indigo' | 'orange';

const variants: Record<Variant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-800',
  orange: 'bg-orange-100 text-orange-800',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

const STATUS_MAP: Record<string, { key: string; variant: Variant }> = {
  // floor check / daily plan
  draft: { key: 'status.draft', variant: 'gray' },
  published: { key: 'status.published', variant: 'blue' },
  closed: { key: 'status.closed', variant: 'purple' },
  submitted: { key: 'status.submitted', variant: 'blue' },
  under_review: { key: 'status.under_review', variant: 'yellow' },
  returned: { key: 'status.returned', variant: 'yellow' },
  approved: { key: 'status.approved', variant: 'green' },
  rejected: { key: 'status.rejected', variant: 'red' },
  // user / project / item
  active: { key: 'status.active', variant: 'green' },
  inactive: { key: 'status.inactive', variant: 'red' },
  // inventory
  available: { key: 'status.available', variant: 'green' },
  low_stock: { key: 'status.low_stock', variant: 'yellow' },
  out_of_stock: { key: 'status.out_of_stock', variant: 'red' },
  over_consumed: { key: 'status.over_consumed', variant: 'red' },
  // floor check line
  ok: { key: 'status.ok', variant: 'green' },
  shortage: { key: 'status.shortage', variant: 'red' },
  extra: { key: 'status.extra', variant: 'blue' },
  not_available: { key: 'status.not_available', variant: 'gray' },
  replaced: { key: 'status.replaced', variant: 'purple' },
  needs_review: { key: 'status.needs_review', variant: 'yellow' },
  // type
  food: { key: 'status.food', variant: 'green' },
  material: { key: 'status.material', variant: 'blue' },
  both: { key: 'status.both', variant: 'indigo' },
  // shift
  morning: { key: 'status.morning', variant: 'yellow' },
  afternoon: { key: 'status.afternoon', variant: 'blue' },
  evening: { key: 'status.evening', variant: 'purple' },
  night: { key: 'status.night', variant: 'gray' },
  // batch
  consumed: { key: 'status.consumed', variant: 'gray' },
  expired: { key: 'status.expired', variant: 'red' },
  spoiled: { key: 'status.spoiled', variant: 'red' },
  recalled: { key: 'status.recalled', variant: 'orange' },
  // supplier
  blacklisted: { key: 'status.blacklisted', variant: 'red' },
  // fridge check
  issue_found: { key: 'status.issue_found', variant: 'yellow' },
  corrective_action_required: { key: 'status.corrective_action_required', variant: 'red' },
  // corrective action
  open: { key: 'status.open', variant: 'red' },
  in_progress: { key: 'status.in_progress', variant: 'yellow' },
  resolved: { key: 'status.resolved', variant: 'green' },
  // priority
  low: { key: 'status.low', variant: 'gray' },
  medium: { key: 'status.medium', variant: 'yellow' },
  high: { key: 'status.high', variant: 'orange' },
  critical: { key: 'status.critical', variant: 'red' },
  // spoilage alert type
  near_expiry: { key: 'status.near_expiry', variant: 'yellow' },
  temperature_breach: { key: 'status.temperature_breach', variant: 'orange' },
  damaged: { key: 'status.damaged', variant: 'red' },
  // spoilage alert status
  dismissed: { key: 'status.dismissed', variant: 'gray' },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config = STATUS_MAP[status];
  if (!config) return <Badge variant="gray">{status}</Badge>;
  return <Badge variant={config.variant}>{t(config.key, { defaultValue: status })}</Badge>;
}
