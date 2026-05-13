import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index';

export function SignupPage() {
  const [form, setForm] = useState({
    orgName: '', slug: '', adminFullName: '', adminEmail: '',
    adminPassword: '', siteName: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
      if (data.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.adminEmail)}`);
      } else {
        // Should not happen in normal flow but handle gracefully
        navigate('/dashboard');
      }
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
          {/* Lang toggle */}
          <div className="flex justify-end mb-4 gap-1">
            <button onClick={() => setLanguage('en')} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>EN</button>
            <button onClick={() => setLanguage('ar')} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${i18n.language === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>عربي</button>
          </div>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-tight">M</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.signUpTitle')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('auth.signUpSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input type="text" className="input" required value={form.orgName}
                  onChange={e => { set('orgName', e.target.value); set('slug', autoSlug(e.target.value)); }}
                  placeholder="Acme Corp" autoComplete="organization" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-sm flex-shrink-0">mirsad.app/</span>
                  <input type="text" className="input flex-1" required value={form.slug}
                    onChange={e => set('slug', e.target.value)}
                    placeholder="acme-corp" pattern="[a-z0-9-]+" title="Only lowercase letters, numbers, and hyphens" />
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
                  onChange={e => set('adminEmail', e.target.value)} placeholder="jane@acme.com" autoComplete="email" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" className="input" required minLength={8}
                  value={form.adminPassword}
                  onChange={e => set('adminPassword', e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">First Site / Location Name</label>
                <input type="text" className="input" required value={form.siteName}
                  onChange={e => set('siteName', e.target.value)} placeholder="Main Office" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? t('auth.creating') : t('auth.createOrg')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">{t('auth.signIn')}</Link>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{t('auth.backToHome')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
