import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { FloorCheck } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export function ApprovalsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const pendingStatuses = user?.role === 'assistant_supervisor' ? 'submitted'
    : user?.role === 'project_manager' ? 'under_review'
    : 'submitted,under_review';

  const { data, isLoading } = useQuery({
    queryKey: ['approvals-queue', page, pendingStatuses],
    queryFn: () => apiClient.get(`/floor-checks?page=${page}&limit=20&status=${pendingStatuses}`).then(r => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.post(`/approvals/floor_check/${id}/${action}`, { comment: '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals-queue'] }); toast.success('Action recorded'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approval Queue</h1>
        <p className="text-slate-500 text-sm mt-1">Floor checks pending your action</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Date', 'Floor', 'Building', 'Supervisor', 'Status', 'Next Step', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No pending items</td></tr>
            )}
            {data?.data?.map((c: FloorCheck) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{formatDate(c.date)}</td>
                <td className="px-4 py-3 text-slate-600">{typeof c.floor === 'object' ? c.floor.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{typeof c.building === 'object' ? c.building.name : '-'}</td>
                <td className="px-4 py-3 text-slate-500">{typeof c.supervisor === 'object' ? c.supervisor.fullName : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs capitalize">{c.currentApprovalStep?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/floor-checks/${c._id}`} className="text-slate-400 hover:text-indigo-600" title="View"><Eye className="h-4 w-4" /></Link>
                    {c.status === 'submitted' && user?.role === 'assistant_supervisor' && (
                      <button onClick={() => actionMutation.mutate({ id: c._id, action: 'review' })} className="text-slate-400 hover:text-blue-600" title="Mark Under Review">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {c.status === 'under_review' && user?.role === 'project_manager' && (
                      <>
                        <button onClick={() => actionMutation.mutate({ id: c._id, action: 'approve' })} className="text-slate-400 hover:text-green-600" title="Approve">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => actionMutation.mutate({ id: c._id, action: 'return' })} className="text-slate-400 hover:text-amber-600" title="Return">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button onClick={() => actionMutation.mutate({ id: c._id, action: 'reject' })} className="text-slate-400 hover:text-red-600" title="Reject">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
