import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { FloorCheck } from '../../types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports-floor-checks', page],
    queryFn: () => apiClient.get(`/floor-checks?page=${page}&limit=25&status=approved`).then(r => r.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Export</h1>
        <p className="text-slate-500 text-sm mt-1">Export approved floor checks and inventory reports</p>
      </div>

      {/* Inventory Reports */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Inventory Reports</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input type="month" className="input w-40" value={period} onChange={e => setPeriod(e.target.value)} />
          <a href={`/api/reports/inventory/food/excel?period=${period}`} target="_blank" rel="noreferrer" className="btn-primary">
            <Download className="h-4 w-4" /> Food Inventory Excel
          </a>
          <a href={`/api/reports/inventory/material/excel?period=${period}`} target="_blank" rel="noreferrer" className="btn-secondary">
            <Download className="h-4 w-4" /> Materials Warehouse Excel
          </a>
        </div>
      </div>

      {/* Approved Floor Checks */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">Approved Floor Check Reports</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Date', 'Floor', 'Building', 'Supervisor', 'Status', 'PDF', 'Excel'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data?.map((c: FloorCheck) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{formatDate(c.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{typeof c.floor === 'object' ? c.floor.name : '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{typeof c.building === 'object' ? c.building.name : '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{typeof c.supervisor === 'object' ? c.supervisor.fullName : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <a href={`/api/reports/floor-check/${c._id}/pdf`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/api/reports/floor-check/${c._id}/excel`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" /> Excel
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
}
