import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Mail, Server, Send, Save, Eye, EyeOff, Loader2, Zap, Building2 } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

const ALERT_KEYS = [
  'clientRequestCreated',
  'clientRequestAssigned',
  'clientRequestDelivered',
  'clientRequestConfirmed',
  'lowStock',
  'outOfStock',
  'newPurchaseOrder',
  'receivingCompleted',
  'maintenanceOpened',
  'maintenanceCompleted',
] as const;

type AlertKey = typeof ALERT_KEYS[number];
type EmailProvider = 'smtp' | 'resend';

interface Settings {
  emailProvider: EmailProvider;
  resendApiKey: string;
  resendFromEmail: string;
  resendFromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpTls: boolean;
  notificationRecipients: string[];
  emailAlerts: Record<AlertKey, boolean>;
  clientName: string;
  clientLogoUrl: string;
  clientSiteName: string;
  clientDepartment: string;
}

const DEFAULTS: Settings = {
  emailProvider: 'smtp',
  resendApiKey: '',
  resendFromEmail: '',
  resendFromName: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFromEmail: '',
  smtpFromName: '',
  smtpTls: false,
  notificationRecipients: [],
  emailAlerts: {
    clientRequestCreated: true,
    clientRequestAssigned: true,
    clientRequestDelivered: true,
    clientRequestConfirmed: true,
    lowStock: true,
    outOfStock: true,
    newPurchaseOrder: true,
    receivingCompleted: true,
    maintenanceOpened: true,
    maintenanceCompleted: true,
  },
  clientName: '',
  clientLogoUrl: '',
  clientSiteName: '',
  clientDepartment: '',
};

function SectionCard({ title, icon: Icon, children, badge }: { title: string; icon: React.ElementType; children: React.ReactNode; badge?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Icon className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {badge && (
          <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{badge}</span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
      <label className="text-sm font-medium text-slate-700 sm:pt-2">{label}</label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

export function SettingsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  // notification recipients field (edit as comma-joined text, store as array on save)
  const [notifRaw, setNotifRaw] = useState('');
  const [notifError, setNotifError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailError, setTestEmailError] = useState<string | null>(null);
  const [testSubject, setTestSubject] = useState('');
  const [testSubjectError, setTestSubjectError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testMessageError, setTestMessageError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Parse comma-separated input into trimmed, non-empty array
  function parseRecipients(raw: string): string[] {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  const emailRe = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

  // Returns error message or null if valid
  function validateRecipients(raw: string): string | null {
    if (!raw.trim()) return null;
    if (/;/.test(raw)) return t('settings.testEmailErrorSemicolon');
    if (/"/.test(raw) || /</.test(raw) || />/.test(raw))
      return t('settings.testEmailErrorQuoted');
    const emails = parseRecipients(raw);
    if (emails.length === 0) return t('settings.testEmailRequired');
    const bad = emails.filter(e => !emailRe.test(e));
    if (bad.length > 0) return `${t('settings.testEmailErrorInvalid')}: ${bad.join(', ')}`;
    return null;
  }

  function validateNotifRecipients(raw: string): string | null {
    if (!raw.trim()) return null;
    if (/;/.test(raw)) return t('settings.testEmailErrorSemicolon');
    if (/"/.test(raw) || /</.test(raw) || />/.test(raw))
      return t('settings.testEmailErrorQuoted');
    const emails = raw.split(',').map(s => s.trim()).filter(Boolean);
    const bad = emails.filter(e => !emailRe.test(e));
    if (bad.length > 0) return `${t('settings.testEmailErrorInvalid')}: ${bad.join(', ')}`;
    return null;
  }

  function handleNotifChange(value: string) {
    setNotifRaw(value);
    setNotifError(validateNotifRecipients(value));
  }

  function handleTestEmailChange(value: string) {
    setTestEmail(value);
    setTestEmailError(validateRecipients(value));
  }

  const { isLoading, data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data.data as Settings),
  });

  useEffect(() => {
    if (settingsData && !loaded) {
      setForm({ ...DEFAULTS, ...settingsData, emailAlerts: { ...DEFAULTS.emailAlerts, ...(settingsData.emailAlerts || {}) } });
      setNotifRaw((settingsData.notificationRecipients || []).join(', '));
      setLoaded(true);
    }
  }, [settingsData]);

  // Set i18n-dependent defaults once translations are ready
  useEffect(() => {
    if (!testSubject) setTestSubject(t('settings.testEmailSubjectDefault'));
    if (!testMessage) setTestMessage(t('settings.testEmailMessageDefault'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const notificationRecipients = notifRaw.split(',').map(s => s.trim()).filter(Boolean);
      return apiClient.put('/settings', { ...form, notificationRecipients });
    },
    onSuccess: () => toast.success(t('settings.settingsSaved')),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const testMutation = useMutation({
    mutationFn: () => {
      const recipients = parseRecipients(testEmail);
      return apiClient.post('/settings/test-email', { to: recipients, subject: testSubject, message: testMessage }, { timeout: 12_000 });
    },
    onSuccess: (res) => toast.success(res.data?.message || t('settings.testEmailSent')),
    onError: (e: any) => {
      const msg = e.response?.data?.message
        ?? (e.code === 'ECONNABORTED' ? 'Request timed out — no response from server' : null)
        ?? t('settings.testEmailFailed');
      toast.error(msg, { duration: 6000 });
    },
  });

  function set(key: keyof Settings, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setAlert(key: AlertKey, value: boolean) {
    setForm(prev => ({ ...prev, emailAlerts: { ...prev.emailAlerts, [key]: value } }));
  }

  if (isLoading && !loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isResend = form.emailProvider === 'resend';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
      </div>

      {/* Provider selection */}
      <SectionCard title={t('settings.emailProvider')} icon={Mail}>
        <div className="flex gap-3">
          {(['resend', 'smtp'] as EmailProvider[]).map(p => (
            <button
              key={p}
              onClick={() => set('emailProvider', p)}
              className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                form.emailProvider === p
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {p === 'resend' ? <Zap className="h-5 w-5" /> : <Server className="h-5 w-5" />}
              {p === 'resend' ? 'Resend' : 'SMTP'}
              <span className="text-xs font-normal text-slate-400">
                {p === 'resend' ? t('settings.providerResendDesc') : t('settings.providerSmtpDesc')}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Resend config */}
      {isResend && (
        <SectionCard title="Resend" icon={Zap} badge={t('settings.activeProvider')}>
          <div className="space-y-4">
            <Field label={t('settings.resendApiKey')}>
              <div className="relative">
                <input
                  className={inputCls + ' pe-10'}
                  type={showApiKey ? 'text' : 'password'}
                  value={form.resendApiKey}
                  onChange={e => set('resendApiKey', e.target.value)}
                  placeholder="re_••••••••••••••••••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(p => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label={t('settings.smtpFromEmail')}>
              <input
                className={inputCls}
                value={form.resendFromEmail}
                onChange={e => set('resendFromEmail', e.target.value)}
                placeholder="alerts@stdsec.sa"
              />
            </Field>
            <Field label={t('settings.smtpFromName')}>
              <input
                className={inputCls}
                value={form.resendFromName}
                onChange={e => set('resendFromName', e.target.value)}
                placeholder="Mirsad Alerts"
              />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* SMTP config */}
      {!isResend && (
        <SectionCard title={t('settings.smtpConfig')} icon={Server} badge={t('settings.activeProvider')}>
          <div className="space-y-4">
            <Field label={t('settings.smtpHost')}>
              <input className={inputCls} value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.office365.com" />
            </Field>
            <Field label={t('settings.smtpPort')}>
              <input className={inputCls} type="number" value={form.smtpPort} onChange={e => set('smtpPort', Number(e.target.value))} placeholder="587" />
            </Field>
            <Field label={t('settings.smtpUser')}>
              <input className={inputCls} value={form.smtpUser} onChange={e => set('smtpUser', e.target.value)} placeholder="user@example.com" autoComplete="off" />
            </Field>
            <Field label={t('settings.smtpPass')}>
              <div className="relative">
                <input
                  className={inputCls + ' pe-10'}
                  type={showPass ? 'text' : 'password'}
                  value={form.smtpPass}
                  onChange={e => set('smtpPass', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label={t('settings.smtpFromEmail')}>
              <input className={inputCls} value={form.smtpFromEmail} onChange={e => set('smtpFromEmail', e.target.value)} placeholder="noreply@example.com" />
            </Field>
            <Field label={t('settings.smtpFromName')}>
              <input className={inputCls} value={form.smtpFromName} onChange={e => set('smtpFromName', e.target.value)} placeholder="Mirsad System" />
            </Field>
            <Field label={t('settings.smtpTls')}>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={form.smtpTls}
                  onChange={e => set('smtpTls', e.target.checked)}
                />
                <span className="text-sm text-slate-700">{t('settings.smtpTls')}</span>
              </label>
            </Field>
          </div>
        </SectionCard>
      )}

      {/* Test Email */}
      <SectionCard title={t('settings.testEmail')} icon={Send}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {isResend ? t('settings.testViaResend') : t('settings.testViaSmtp')}
          </p>

          {/* Recipients */}
          <Field label={t('settings.testEmailTo')}>
            <div className="space-y-1">
              <input
                className={inputCls + (testEmailError ? ' border-red-400 focus:ring-red-400' : '')}
                type="text"
                value={testEmail}
                onChange={e => handleTestEmailChange(e.target.value)}
                placeholder="m.assaf@kuzama.co, Sultan.Naif@KUZAMA.CO"
                disabled={testMutation.isPending}
                autoComplete="off"
              />
              {testEmailError && (
                <p className="text-xs text-red-600 font-medium">{testEmailError}</p>
              )}
              {!testEmailError && testEmail && (
                <p className="text-xs text-slate-400">
                  {parseRecipients(testEmail).length} {t('settings.testEmailRecipientCount')}
                </p>
              )}
              {!testEmailError && !testEmail && (
                <p className="text-xs text-slate-400">{t('settings.testEmailHint')}</p>
              )}
            </div>
          </Field>

          {/* Subject */}
          <Field label={t('settings.testEmailSubjectLabel')}>
            <div className="space-y-1">
              <input
                className={inputCls + (testSubjectError ? ' border-red-400 focus:ring-red-400' : '')}
                type="text"
                value={testSubject}
                onChange={e => {
                  setTestSubject(e.target.value);
                  setTestSubjectError(e.target.value.trim() ? null : t('settings.testEmailSubjectRequired'));
                }}
                disabled={testMutation.isPending}
              />
              {testSubjectError && (
                <p className="text-xs text-red-600 font-medium">{testSubjectError}</p>
              )}
            </div>
          </Field>

          {/* Message */}
          <Field label={t('settings.testEmailMessageLabel')}>
            <div className="space-y-1">
              <textarea
                className={inputCls + ' resize-y min-h-[80px]' + (testMessageError ? ' border-red-400 focus:ring-red-400' : '')}
                value={testMessage}
                onChange={e => {
                  setTestMessage(e.target.value);
                  setTestMessageError(e.target.value.trim() ? null : t('settings.testEmailMessageRequired'));
                }}
                disabled={testMutation.isPending}
                rows={3}
              />
              {testMessageError && (
                <p className="text-xs text-red-600 font-medium">{testMessageError}</p>
              )}
            </div>
          </Field>

          <div className="flex items-center justify-between pt-1">
            {testMutation.isPending && (
              <p className="text-xs text-slate-500">{t('settings.testEmailWait')}</p>
            )}
            <div className="ms-auto">
              <button
                onClick={() => {
                  let hasError = false;
                  if (!testEmail) { setTestEmailError(t('settings.testEmailRequired')); hasError = true; }
                  if (!testSubject.trim()) { setTestSubjectError(t('settings.testEmailSubjectRequired')); hasError = true; }
                  if (!testMessage.trim()) { setTestMessageError(t('settings.testEmailMessageRequired')); hasError = true; }
                  if (hasError || !!testEmailError || !!testSubjectError || !!testMessageError) return;
                  testMutation.mutate();
                }}
                disabled={testMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{t('settings.testEmailSending')}</>
                  : <><Send className="h-4 w-4" />{t('settings.testEmail')}</>}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Email Alert Controls */}
      <SectionCard title={t('settings.emailAlerts')} icon={Mail}>
        <p className="text-sm text-slate-500 mb-5">{t('settings.emailAlertsDesc')}</p>

        {/* Notification Recipients */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('settings.notificationRecipients')}
          </label>
          <input
            className={inputCls + (notifError ? ' border-red-400 focus:ring-red-400' : '')}
            type="text"
            value={notifRaw}
            onChange={e => handleNotifChange(e.target.value)}
            placeholder="iii_hx@hotmail.com, m.assaf@kuzama.co, Sultan.Naif@KUZAMA.CO"
            autoComplete="off"
          />
          {notifError
            ? <p className="mt-1 text-xs text-red-600 font-medium">{notifError}</p>
            : <p className="mt-1 text-xs text-slate-400">{t('settings.notificationRecipientsHint')}</p>
          }
        </div>

        <div className="space-y-3">
          {ALERT_KEYS.map(key => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={form.emailAlerts[key]}
                onChange={e => setAlert(key, e.target.checked)}
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {t(`settings.alerts.${key}`)}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Client Branding */}
      <SectionCard title={t('clientBranding.title')} icon={Building2}>
        <div className="space-y-4">
          <Field label={t('clientBranding.clientName')}>
            <input className={inputCls} value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Acme Corporation" />
          </Field>
          <Field label={t('clientBranding.clientSiteName')}>
            <input className={inputCls} value={form.clientSiteName} onChange={e => setForm(p => ({ ...p, clientSiteName: e.target.value }))} placeholder="Riyadh HQ Cafeteria" />
          </Field>
          <Field label={t('clientBranding.clientDepartment')}>
            <input className={inputCls} value={form.clientDepartment} onChange={e => setForm(p => ({ ...p, clientDepartment: e.target.value }))} placeholder="Facilities Management" />
          </Field>
          <Field label={t('clientBranding.clientLogoUrl')}>
            <input className={inputCls} value={form.clientLogoUrl} onChange={e => setForm(p => ({ ...p, clientLogoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
            <p className="mt-1 text-xs text-slate-400">{t('clientBranding.logoHint')}</p>
          </Field>
          {form.clientLogoUrl && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-500 font-medium">{t('clientBranding.preview')}:</span>
              <img src={form.clientLogoUrl} alt="logo preview" className="h-10 w-auto rounded-lg border border-slate-200 object-contain bg-slate-50 p-1"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? '...' : t('settings.saveSettings')}
        </button>
      </div>
    </div>
  );
}
