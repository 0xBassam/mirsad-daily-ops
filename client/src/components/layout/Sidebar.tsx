import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Package, ClipboardList,
  CheckSquare, Utensils, GitBranch,
  FileText, BookOpen, LogOut, ChevronDown, Thermometer,
  Boxes, ShieldCheck, ShoppingCart, Trash2, ArrowRightLeft, Truck, Wrench, MessageSquare, UtensilsCrossed, Settings, ChefHat
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/roleHelpers';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index';
import apiClient from '../../api/client';

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
  roleLabelKeys?: Partial<Record<UserRole, string>>;
  roles: UserRole[];
  children?: { to: string; labelKey: string }[];
}

interface NavSection {
  labelKey?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', roles: ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'client', 'kitchen'] },
    ],
  },
  {
    labelKey: 'nav.section.operations',
    items: [
      { to: '/daily-plans',        icon: ClipboardList,  labelKey: 'nav.dailyPlans',        roles: ['admin', 'supervisor', 'project_manager', 'operations'] },
      { to: '/floor-checks',       icon: CheckSquare,    labelKey: 'nav.floorChecks',       roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'operations'] },
      { to: '/approvals',          icon: GitBranch,      labelKey: 'nav.approvals',         roles: ['assistant_supervisor', 'project_manager', 'admin'] },
      { to: '/purchase-orders',    icon: ShoppingCart,   labelKey: 'nav.purchaseOrders',    roles: ['admin', 'project_manager', 'assistant_supervisor', 'warehouse'] },
      { to: '/spoilage',           icon: Trash2,           labelKey: 'nav.spoilageRecording', roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'operations', 'warehouse', 'kitchen'] },
      { to: '/corrective-actions', icon: ShieldCheck,    labelKey: 'nav.correctiveActions', roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'operations'] },
      { to: '/transfers',          icon: ArrowRightLeft,  labelKey: 'nav.transfers',         roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'warehouse'] },
      { to: '/receiving',          icon: Truck,           labelKey: 'nav.receiving',         roles: ['assistant_supervisor', 'project_manager', 'admin', 'warehouse'] },
      { to: '/maintenance',        icon: Wrench,          labelKey: 'nav.maintenance',       roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'operations'] },
      { to: '/client-requests',    icon: MessageSquare,   labelKey: 'nav.clientRequests', roleLabelKeys: { client: 'nav.myRequests' }, roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'operations', 'client'] },
      { to: '/menu',               icon: UtensilsCrossed, labelKey: 'nav.menu',              roles: ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations'] },
    ],
  },
  {
    labelKey: 'nav.section.kitchen',
    items: [
      { to: '/kitchen-dashboard', icon: ChefHat,  labelKey: 'nav.kitchenDashboard', roles: ['kitchen'] },
      { to: '/inventory/food',    icon: Utensils,  labelKey: 'nav.kitchenStock',     roles: ['kitchen'] },
      { to: '/spoilage',          icon: Trash2,    labelKey: 'nav.spoilageRecording', roles: ['kitchen'] },
      { to: '/reports',           icon: FileText,  labelKey: 'nav.reports',           roles: ['kitchen'] },
    ],
  },
  {
    labelKey: 'nav.section.inventory',
    items: [
      {
        to: '/inventory', icon: Utensils, labelKey: 'nav.inventory', roles: ['admin', 'project_manager', 'assistant_supervisor', 'warehouse'],
        children: [
          { to: '/inventory/food',      labelKey: 'nav.foodInventory' },
          { to: '/inventory/materials', labelKey: 'nav.materialsWarehouse' },
          { to: '/inventory/movements', labelKey: 'nav.stockMovements' },
        ],
      },
      {
        to: '/food-safety', icon: Thermometer, labelKey: 'nav.foodSafety', roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin', 'warehouse'],
        children: [
          { to: '/fridge-checks',   labelKey: 'nav.fridgeChecks' },
          { to: '/expiry-tracking', labelKey: 'nav.expiryTracking' },
          { to: '/spoilage-alerts', labelKey: 'nav.spoilageAlerts' },
        ],
      },
      {
        to: '/traceability', icon: Boxes, labelKey: 'nav.traceability', roles: ['admin', 'project_manager', 'assistant_supervisor', 'warehouse'],
        children: [
          { to: '/batches',   labelKey: 'nav.batches' },
          { to: '/suppliers', labelKey: 'nav.suppliers' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.section.management',
    items: [
      {
        to: '/projects', icon: Building2, labelKey: 'nav.projectsLocations', roles: ['admin', 'project_manager'],
        children: [
          { to: '/projects',  labelKey: 'nav.projects' },
          { to: '/buildings', labelKey: 'nav.buildings' },
          { to: '/floors',    labelKey: 'nav.floors' },
        ],
      },
      {
        to: '/items', icon: Package, labelKey: 'nav.itemsMaster', roles: ['admin', 'project_manager'],
        children: [
          { to: '/items',      labelKey: 'nav.items' },
          { to: '/categories', labelKey: 'nav.categories' },
        ],
      },
      { to: '/users', icon: Users, labelKey: 'nav.users', roles: ['admin'] },
      { to: '/settings', icon: Settings, labelKey: 'nav.settings', roles: ['admin'] },
    ],
  },
  {
    labelKey: 'nav.section.reportsGov',
    items: [
      { to: '/reports',    icon: FileText, labelKey: 'nav.reports',   roles: ['admin', 'project_manager', 'supervisor', 'operations', 'warehouse', 'client'] },
      { to: '/audit-logs', icon: BookOpen, labelKey: 'nav.auditLogs', roles: ['admin'] },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    logout();
  }

  function handleLang(lang: 'en' | 'ar') {
    setLanguage(lang);
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full md:h-screen md:sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">Mirsad</div>
            <div className="text-slate-400 text-xs">مرصاد · Daily Ops</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navSections.map((section, si) => {
          const visibleItems = section.items.filter(item => user && item.roles.includes(user.role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={si}>
              {section.labelKey && (
                <p className="nav-section-label">{t(section.labelKey)}</p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expanded === item.to;
                  const labelKey = (user?.role && item.roleLabelKeys?.[user.role]) ?? item.labelKey;

                  if (hasChildren) {
                    return (
                      <div key={item.to}>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : item.to)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-start">{t(labelKey)}</span>
                          <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                        {isExpanded && (
                          <div className="ms-7 mt-0.5 space-y-0.5">
                            {item.children!.map(child => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  clsx('block px-3 py-2 rounded-lg text-sm transition-colors',
                                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')
                                }
                              >
                                {t(child.labelKey)}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800')
                      }
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {t(labelKey)}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-4 py-2 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{t('common.language')}:</span>
          <button
            onClick={() => handleLang('en')}
            className={clsx('text-xs px-2 py-0.5 rounded transition-colors', i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}
          >
            EN
          </button>
          <button
            onClick={() => handleLang('ar')}
            className={clsx('text-xs px-2 py-0.5 rounded transition-colors', i18n.language === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}
          >
            عربي
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.fullName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.role ? ROLE_LABELS[user.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('auth.signOut')}
        </button>
      </div>
    </aside>
  );
}
