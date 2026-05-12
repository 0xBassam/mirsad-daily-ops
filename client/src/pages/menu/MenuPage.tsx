import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { UtensilsCrossed, Plus, Coffee, Sun, Moon, Sunset } from 'lucide-react';
import apiClient from '../../api/client';

const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast:    Sun,
  lunch:        Sunset,
  dinner:       Moon,
  coffee_break: Coffee,
};

const MEAL_COLORS: Record<string, string> = {
  breakfast:    'bg-amber-50  border-amber-200  text-amber-700',
  lunch:        'bg-orange-50 border-orange-200 text-orange-700',
  dinner:       'bg-indigo-50 border-indigo-200 text-indigo-700',
  coffee_break: 'bg-purple-50 border-purple-200 text-purple-700',
};

const MEAL_HEADER: Record<string, string> = {
  breakfast:    'bg-amber-500',
  lunch:        'bg-orange-500',
  dinner:       'bg-indigo-500',
  coffee_break: 'bg-purple-500',
};

export function MenuPage() {
  const { t } = useTranslation();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['menu', date],
    queryFn: () => apiClient.get('/menu', { params: { date } }).then(r => r.data.data as any[]),
  });

  const menus = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('menu.title')}</h1>
            <p className="text-slate-500 text-sm">{t('menu.subtitle')}</p>
          </div>
        </div>
        <Link to="/menu/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t('menu.addMenu')}
        </Link>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-600">{t('common.date')}:</label>
        <input
          type="date"
          className="input w-48"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          className="btn-secondary text-sm"
          onClick={() => setDate(today)}
        >
          {t('menu.today')}
        </button>
      </div>

      {/* Menus */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-400">{t('common.loading')}</div>
      ) : menus.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <UtensilsCrossed className="h-12 w-12 text-slate-200 mx-auto" />
          <p className="text-slate-400 font-medium">{t('menu.noMenuForDate')}</p>
          <Link to="/menu/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> {t('menu.addMenu')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {menus.map((menu: any) => {
            const Icon = MEAL_ICONS[menu.mealType] ?? UtensilsCrossed;
            return (
              <div key={menu._id} className={`rounded-2xl border overflow-hidden shadow-sm ${MEAL_COLORS[menu.mealType] ?? 'bg-slate-50 border-slate-200'}`}>
                {/* Card header */}
                <div className={`px-5 py-4 flex items-center justify-between ${MEAL_HEADER[menu.mealType] ?? 'bg-slate-500'}`}>
                  <div className="flex items-center gap-2.5 text-white">
                    <Icon className="h-5 w-5" />
                    <h2 className="font-bold text-base">{t(`menu.mealTypes.${menu.mealType}`)}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {menu.items?.length ?? 0} {t('menu.items')}
                    </span>
                    <Link to={`/menu/${menu._id}`} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors">
                      {t('common.edit')}
                    </Link>
                  </div>
                </div>

                {/* Items table */}
                <div className="p-4">
                  {menu.items?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs font-semibold text-slate-500 uppercase border-b border-current/10">
                          <th className="text-start pb-2">{t('common.name')}</th>
                          <th className="text-end pb-2">{t('common.quantity')}</th>
                          <th className="text-end pb-2">{t('common.unit')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-current/5">
                        {menu.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="py-1.5 font-medium text-slate-800">{item.name}</td>
                            <td className="py-1.5 text-end font-bold tabular-nums text-slate-900">{item.quantity}</td>
                            <td className="py-1.5 text-end text-slate-500 text-xs">{item.unit || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-3">{t('menu.noItems')}</p>
                  )}
                  {menu.notes && (
                    <p className="mt-3 pt-3 border-t border-current/10 text-xs text-slate-500 italic">{menu.notes}</p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    {t('menu.addedBy')}: {(menu.createdBy as any)?.fullName ?? '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
