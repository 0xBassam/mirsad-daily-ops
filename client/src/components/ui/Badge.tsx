import { clsx } from 'clsx';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'indigo';

const variants: Record<Variant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-800',
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

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    draft: { label: 'Draft', variant: 'gray' },
    published: { label: 'Published', variant: 'blue' },
    closed: { label: 'Closed', variant: 'purple' },
    submitted: { label: 'Submitted', variant: 'blue' },
    under_review: { label: 'Under Review', variant: 'yellow' },
    returned: { label: 'Returned', variant: 'yellow' },
    approved: { label: 'Approved', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    active: { label: 'Active', variant: 'green' },
    inactive: { label: 'Inactive', variant: 'red' },
    available: { label: 'Available', variant: 'green' },
    low_stock: { label: 'Low Stock', variant: 'yellow' },
    out_of_stock: { label: 'Out of Stock', variant: 'red' },
    over_consumed: { label: 'Over Consumed', variant: 'red' },
    ok: { label: 'OK', variant: 'green' },
    shortage: { label: 'Shortage', variant: 'red' },
    extra: { label: 'Extra', variant: 'blue' },
    not_available: { label: 'N/A', variant: 'gray' },
    replaced: { label: 'Replaced', variant: 'purple' },
    needs_review: { label: 'Needs Review', variant: 'yellow' },
    food: { label: 'Food', variant: 'green' },
    material: { label: 'Material', variant: 'blue' },
    morning: { label: 'Morning', variant: 'yellow' },
    afternoon: { label: 'Afternoon', variant: 'blue' },
    evening: { label: 'Evening', variant: 'purple' },
    night: { label: 'Night', variant: 'gray' },
  };
  const config = map[status] || { label: status, variant: 'gray' as Variant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
