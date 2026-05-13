import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index';
import { Mail, RefreshCw } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  function startCountdown() {
    setCountdown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-otp', { email: emailFromUrl, otp: otp.trim() });
      toast.success(t('auth.verifySuccess'));
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('auth.otpInvalid');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await apiClient.post('/auth/resend-otp', { email: emailFromUrl });
      toast.success('New verification code sent!');
      setOtp('');
      startCountdown();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
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
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.verifyTitle')}</h1>
            <p className="text-slate-500 text-sm mt-2">
              {t('auth.verifySubtitle')}<br />
              {emailFromUrl && <strong className="text-slate-700">{emailFromUrl}</strong>}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.verifyEnterCode')}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="——————"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-xs text-slate-400 mt-1 text-center">Code expires in 10 minutes</p>
            </div>

            <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full justify-center py-2.5">
              {loading ? t('auth.verifying') : t('auth.verifyButton')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="text-sm text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading
                ? t('auth.resendingCode')
                : countdown > 0
                ? t('auth.resendIn', { seconds: countdown })
                : t('auth.resendCode')}
            </button>
          </div>

          {emailFromUrl && (
            <p className="text-center text-xs text-slate-400 mt-3">
              {t('auth.wrongEmail')}{' '}
              <Link to="/signup" className="text-indigo-500 hover:text-indigo-700">{t('auth.backToHome')}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
