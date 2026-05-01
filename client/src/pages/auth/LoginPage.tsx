import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { role: 'Admin',            email: 'admin@mirsad.demo',      color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100' },
  { role: 'Project Manager',  email: 'manager@mirsad.demo',    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100' },
  { role: 'Asst. Supervisor', email: 'assistant@mirsad.demo',  color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100' },
  { role: 'Supervisor',       email: 'supervisor@mirsad.demo', color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100' },
  { role: 'Client',           email: 'client@mirsad.demo',     color: 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Card header accent */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />

        <div className="p-8">
          {/* Logo + branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl tracking-tight">M</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Mirsad</h1>
            <p className="text-slate-500 text-sm mt-1">مرصاد · Daily Operations Platform</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Monitor · Track · Approve &nbsp;·&nbsp; راقب · تتبّع · اعتمد
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="admin@mirsad.demo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Demo@12345"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Quick Demo Access
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(({ role, email: demoEmail, color }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => { setEmail(demoEmail); setPassword('Demo@12345'); }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${color}`}
                >
                  <span className="font-semibold">{role}</span>
                  <span className="opacity-60 font-mono">{demoEmail}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">Password: Demo@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
