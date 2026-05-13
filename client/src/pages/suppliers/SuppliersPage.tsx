import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Star, Plus, X, Pencil } from 'lucide-react';
import apiClient from '../../api/client';
import { Supplier } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={clsx('h-3.5 w-3.5', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
      ))}
      <span className="ms-1 text-xs text-slate-500">({rating})</span>
    </div>
  );
}

interface SupplierForm {
  name: string; nameAr: string; contactName: string;
  phone: string; email: string; category: string;
  rating: number; status: string; address: string; licenseNumber: string;
}
const EMPTY_FORM: SupplierForm = {
  name: '', nameAr: '', contactName: '', phone: '', email: '',
  category: 'food', rating: 3, status: 'active', address: '', licenseNumber: '',
};

function SupplierModal({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<SupplierForm>(
    supplier
      ? { name: supplier.name, nameAr: supplier.nameAr || '', contactName: supplier.contactName || '',
          phone: supplier.phone || '', email: supplier.email || '', category: supplier.category,
          rating: supplier.rating, status: supplier.status, address: supplier.address || '',
          licenseNumber: supplier.licenseNumber || '' }
      : EMPTY_FORM
  );

  const mutation = useMutation({
    mutationFn: (body: object) =>
      supplier
        ? apiClient.put(`/suppliers/${supplier._id}`, body).then(r => r.data)
        : apiClient.post('/suppliers', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(supplier ? t('common.update') : t('common.create'));
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || t('common.loadError')),
  });

  function f(k: keyof SupplierForm, v: string | number) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{supplier ? t('common.edit') : t('suppliers.new')} {t('nav.suppliers').replace(/s$/, '')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')} (EN) *</label>
              <input className="input w-full" value={form.name} onChange={e => f('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.name')} (AR)</label>
              <input className="input w-full" value={form.nameAr} onChange={e => f('nameAr', e.target.value)} dir="rtl" placeholder="الاسم بالعربي" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.contactName')}</label>
              <input className="input w-full" value={form.contactName} onChange={e => f('contactName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.phone')}</label>
              <input className="input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.email')}</label>
            <input type="email" className="input w-full" value={form.email} onChange={e => f('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.category')} *</label>
              <select className="input w-full" value={form.category} onChange={e => f('category', e.target.value)}>
                <option value="food">{t('suppliers.food')}</option>
                <option value="material">{t('suppliers.material')}</option>
                <option value="both">{t('suppliers.both')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.status')}</label>
              <select className="input w-full" value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
                <option value="blacklisted">{t('suppliers.blacklisted')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.rating')} (1–5)</label>
            <input type="number" min="1" max="5" className="input w-full" value={form.rating} onChange={e => f('rating', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.address')}</label>
            <input className="input w-full" value={form.address} onChange={e => f('address', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.licenseNumber')}</label>
            <input className="input w-full" value={form.licenseNumber} onChange={e => f('licenseNumber', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : supplier ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SuppliersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', category],
    queryFn: () => apiClient.get('/suppliers', { params: category ? { category } : {} }).then(r => r.data),
  });

  const suppliers: Supplier[] = data?.data || [];

  function openCreate() { setEditSupplier(undefined); setShowModal(true); }
  function openEdit(s: Supplier, e: React.MouseEvent) { e.stopPropagation(); setEditSupplier(s); setShowModal(true); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.suppliers')}</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />{t('suppliers.new')}
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">{t('common.all')} {t('common.category')}</option>
          <option value="food">{t('suppliers.food')}</option>
          <option value="material">{t('suppliers.material')}</option>
          <option value="both">{t('suppliers.both')}</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[t('common.name'), t('common.category'), t('common.phone'), t('common.email'), t('common.rating'), t('common.status'), t('common.actions')].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">{t('common.noData')}</td></tr>
              ) : suppliers.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    {s.nameAr && <div className="text-xs text-slate-500" dir="rtl">{s.nameAr}</div>}
                    {s.contactName && <div className="text-xs text-slate-400">{s.contactName}</div>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.category} /></td>
                  <td className="px-4 py-3 text-slate-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{s.email || '—'}</td>
                  <td className="px-4 py-3"><StarRating rating={s.rating} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <button onClick={e => openEdit(s, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors" title={t('common.edit')}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => navigate(`/suppliers/${s._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors" title={t('common.details')}>
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <SupplierModal supplier={editSupplier} onClose={() => setShowModal(false)} />}
    </div>
  );
}
