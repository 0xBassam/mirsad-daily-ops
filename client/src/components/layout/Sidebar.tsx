import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Layers, Package, ClipboardList,
  CheckSquare, Utensils, Warehouse, ArrowLeftRight, GitBranch,
  FileText, BookOpen, LogOut, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/roleHelpers';
import { clsx } from 'clsx';
import { useState } from 'react';
import apiClient from '../../api/client';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
  children?: { to: string; label: string }[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'client'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
  {
    to: '/projects', icon: Building2, label: 'Projects & Locations', roles: ['admin', 'project_manager'],
    children: [
      { to: '/projects', label: 'Projects' },
      { to: '/buildings', label: 'Buildings' },
      { to: '/floors', label: 'Floors' },
    ],
  },
  {
    to: '/items', icon: Package, label: 'Items Master', roles: ['admin', 'project_manager'],
    children: [
      { to: '/items', label: 'Items' },
      { to: '/categories', label: 'Categories' },
    ],
  },
  { to: '/daily-plans', icon: ClipboardList, label: 'Daily Plans', roles: ['admin', 'supervisor', 'project_manager'] },
  { to: '/floor-checks', icon: CheckSquare, label: 'Floor Checks', roles: ['supervisor', 'assistant_supervisor', 'project_manager', 'admin'] },
  {
    to: '/inventory', icon: Utensils, label: 'Inventory', roles: ['admin', 'project_manager', 'assistant_supervisor'],
    children: [
      { to: '/inventory/food', label: 'Food Inventory' },
      { to: '/inventory/materials', label: 'Materials Warehouse' },
      { to: '/inventory/movements', label: 'Stock Movements' },
    ],
  },
  { to: '/approvals', icon: GitBranch, label: 'Approvals', roles: ['assistant_supervisor', 'project_manager', 'client', 'admin'] },
  { to: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'project_manager', 'client'] },
  { to: '/audit-logs', icon: BookOpen, label: 'Audit Logs', roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    logout();
  }

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="text-xl font-bold text-white">Mirsad</div>
        <div className="text-slate-400 text-xs mt-0.5">مرصاد · Daily Ops</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded === item.to;

          if (hasChildren) {
            return (
              <div key={item.to}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.to)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children!.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          clsx('block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')
                        }
                      >
                        {child.label}
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
              className={({ isActive }) =>
                clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800')
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
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
          Sign out
        </button>
      </div>
    </aside>
  );
}
