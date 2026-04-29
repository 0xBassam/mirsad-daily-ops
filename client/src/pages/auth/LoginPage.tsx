import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mirsad</h1>
          <p className="text-slate-500 mt-1 text-sm">مرصاد · Daily Operations Platform</p>
          <p className="text-slate-400 mt-1 text-xs">Monitor. Track. Approve.</p>
        </div>

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
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 font-medium mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-slate-600">
            {[
              ['Admin', 'admin@mirsad.demo'],
              ['Supervisor', 'supervisor@mirsad.demo'],
              ['Assistant', 'assistant@mirsad.demo'],
              ['Manager', 'manager@mirsad.demo'],
              ['Client', 'client@mirsad.demo'],
            ].map(([role, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => { setEmail(email); setPassword('Demo@12345'); }}
                className="block w-full text-left hover:text-indigo-600 transition-colors"
              >
                {role}: {email}
              </button>
            ))}
            <p className="text-slate-400 mt-1">Password: Demo@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
