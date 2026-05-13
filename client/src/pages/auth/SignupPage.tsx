import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

export function SignupPage() {
  const [form, setForm] = useState({
    orgName: '', slug: '', adminFullName: '', adminEmail: '',
    adminPassword: '', siteName: '', plan: 'trial',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/signup', form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-tight">M</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your organization</h1>
            <p className="text-slate-500 text-sm mt-1">Mirsad · Daily Operations Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text" className="input" required
                  value={form.orgName}
                  onChange={e => { set('orgName', e.target.value); set('slug', autoSlug(e.target.value)); }}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                <div className="flex items-center">
                  <span className="text-slate-400 text-sm mr-1">mirsad.app/</span>
                  <input
                    type="text" className="input flex-1" required
                    value={form.slug}
                    onChange={e => set('slug', e.target.value)}
                    placeholder="acme-corp"
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Full Name</label>
                <input type="text" className="input" required value={form.adminFullName}
                  onChange={e => set('adminFullName', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                <input type="email" className="input" required value={form.adminEmail}
                  onChange={e => set('adminEmail', e.target.value)} placeholder="jane@acme.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" className="input" required minLength={8}
                  value={form.adminPassword}
                  onChange={e => set('adminPassword', e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Site / Location Name</label>
                <input type="text" className="input" required value={form.siteName}
                  onChange={e => set('siteName', e.target.value)} placeholder="Main Office" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                <select className="input" value={form.plan} onChange={e => set('plan', e.target.value)}>
                  <option value="trial">Trial (14 days)</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? 'Creating…' : 'Create Organization'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
