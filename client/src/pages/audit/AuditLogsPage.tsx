import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { AuditLog } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/formatDate';

const ACTION_COLORS: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'indigo'> = {
  login: 'green', logout: 'gray', create: 'blue', update: 'yellow',
  delete: 'red', submit: 'indigo', review: 'yellow', approve: 'green',
  reject: 'red', return: 'yellow', export: 'blue',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => apiClient.get(`/audit-logs?page=${page}&limit=30&action=${actionFilter}`).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  const actions = ['', 'login', 'logout', 'create', 'update', 'delete', 'submit', 'review', 'approve', 'reject', 'return', 'export'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">System activity trail</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(a => (
          <button key={a} onClick={() => setActionFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${actionFilter === a ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
            {a || 'All'}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Time', 'User', 'Action', 'Entity Type', 'Details'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.map((log: AuditLog) => (
              <tr key={log._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(log.createdAt)}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{log.user?.fullName || 'System'}</p>
                    <p className="text-xs text-slate-400">{log.user?.role || ''}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ACTION_COLORS[log.action] || 'gray'}>{log.action.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 capitalize text-xs">{log.entityType?.replace(/_/g, ' ') || '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{log.entityId ? log.entityId.toString().slice(-8) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
