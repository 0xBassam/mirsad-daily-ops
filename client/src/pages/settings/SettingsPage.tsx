import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Mail, Server, Send, Save, Eye, EyeOff } from 'lucide-react';
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

interface Settings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpTls: boolean;
  emailAlerts: Record<AlertKey, boolean>;
}

const DEFAULTS: Settings = {
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFromEmail: '',
  smtpFromName: '',
  smtpTls: false,
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
};

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Icon className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
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
  const [testEmail, setTestEmail] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { isLoading, data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data.data as Settings),
  });

  useEffect(() => {
    if (settingsData && !loaded) {
      setForm({ ...DEFAULTS, ...settingsData, emailAlerts: { ...DEFAULTS.emailAlerts, ...(settingsData.emailAlerts || {}) } });
      setLoaded(true);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (body: Settings) => apiClient.put('/settings', body),
    onSuccess: () => toast.success(t('settings.settingsSaved')),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const testMutation = useMutation({
    mutationFn: () => apiClient.post('/settings/test-email', { to: testEmail }),
    onSuccess: () => toast.success(t('settings.testEmailSent')),
    onError: (e: any) => toast.error(e.response?.data?.message || t('settings.testEmailFailed')),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
      </div>

      {/* SMTP Config */}
      <SectionCard title={t('settings.smtpConfig')} icon={Server}>
        <div className="space-y-4">
          <Field label={t('settings.smtpHost')}>
            <input
              className={inputCls}
              value={form.smtpHost}
              onChange={e => set('smtpHost', e.target.value)}
              placeholder="smtp.example.com"
            />
          </Field>
          <Field label={t('settings.smtpPort')}>
            <input
              className={inputCls}
              type="number"
              value={form.smtpPort}
              onChange={e => set('smtpPort', Number(e.target.value))}
              placeholder="587"
            />
          </Field>
          <Field label={t('settings.smtpUser')}>
            <input
              className={inputCls}
              value={form.smtpUser}
              onChange={e => set('smtpUser', e.target.value)}
              placeholder="user@example.com"
              autoComplete="off"
            />
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
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label={t('settings.smtpFromEmail')}>
            <input
              className={inputCls}
              value={form.smtpFromEmail}
              onChange={e => set('smtpFromEmail', e.target.value)}
              placeholder="noreply@example.com"
            />
          </Field>
          <Field label={t('settings.smtpFromName')}>
            <input
              className={inputCls}
              value={form.smtpFromName}
              onChange={e => set('smtpFromName', e.target.value)}
              placeholder="Mirsad System"
            />
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

      {/* Test Email */}
      <SectionCard title={t('settings.testEmail')} icon={Send}>
        <div className="flex items-center gap-3">
          <input
            className={inputCls + ' flex-1'}
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder={t('settings.testEmailTo')}
          />
          <button
            onClick={() => testMutation.mutate()}
            disabled={!testEmail || testMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
            {testMutation.isPending ? '...' : t('settings.testEmail')}
          </button>
        </div>
      </SectionCard>

      {/* Email Alert Controls */}
      <SectionCard title={t('settings.emailAlerts')} icon={Mail}>
        <p className="text-sm text-slate-500 mb-5">{t('settings.emailAlertsDesc')}</p>
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

      {/* Save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={() => saveMutation.mutate(form)}
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
