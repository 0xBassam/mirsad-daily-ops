import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
