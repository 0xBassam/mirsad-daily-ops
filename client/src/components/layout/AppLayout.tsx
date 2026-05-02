import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: always visible on md+, slide-in on mobile */}
      <div
        className={[
          'fixed md:static inset-y-0 start-0 z-30 md:z-auto',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen
            ? 'translate-x-0'
            : 'ltr:-translate-x-full rtl:translate-x-full md:!translate-x-0',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-slate-800 text-sm">Mirsad · مرصاد</span>
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
