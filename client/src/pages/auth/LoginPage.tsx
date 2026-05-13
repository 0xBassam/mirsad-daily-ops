import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />
        <div className="p-8">
          {/* Lang toggle */}
          <div className="flex justify-end mb-4 gap-1">
            <button onClick={() => setLanguage('en')} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>EN</button>
            <button onClick={() => setLanguage('ar')} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${i18n.language === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>عربي</button>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl tracking-tight">M</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Mirsad <span className="text-slate-400 font-light text-lg">مرصاد</span></h1>
            <p className="text-slate-500 text-sm mt-1">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@company.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? t('auth.signingIn') : `${t('auth.signIn')} →`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">{t('auth.startTrial')}</Link>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{t('auth.backToHome')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
