import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
