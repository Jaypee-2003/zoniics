import { useState } from 'react';
import {
  Settings, Save, CheckCircle, Globe, Mail, Bell,
  Database, Server, Shield, AlertTriangle, Code,
} from 'lucide-react';

const DEFAULT = {
  platformName: 'Zoniics AI',
  supportEmail: 'support@zoniics.ai',
  maintenanceMessage: 'Platform is under scheduled maintenance. We\'ll be back shortly.',
  maxTenantsPerPlan: { starter: 200, pro: 500, enterprise: 9999 },
  globalWebhookUrl: '',
  slackAlertWebhook: '',
  emailNotifications: true,
  slackNotifications: false,
  autoBackup: true,
  backupRetentionDays: 30,
  debugMode: false,
  rateLimitGlobal: 5000,
  sessionTimeoutMinutes: 60,
};

const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center">
          <Icon size={16} className="text-white" />
        </div>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ active, onToggle, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={onToggle}
        className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors mt-0.5 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

export default function SASettings() {
  const [cfg, setCfg] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const tog = k => setCfg(c => ({ ...c, [k]: !c[k] }));

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Platform Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Global configuration for the Zoniics platform</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle size={15} /> Settings saved
            </span>
          )}
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
            <Save size={15} />
            Save All
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* Platform Identity */}
        <Section icon={Globe} title="Platform Identity">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Platform Name</label>
              <input type="text" value={cfg.platformName}
                onChange={e => set('platformName', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Support Email</label>
              <input type="email" value={cfg.supportEmail}
                onChange={e => set('supportEmail', e.target.value)}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Maintenance Mode Message</label>
              <input type="text" value={cfg.maintenanceMessage}
                onChange={e => set('maintenanceMessage', e.target.value)}
                className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Integrations & Webhooks */}
        <Section icon={Code} title="Integrations & Webhooks">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Global Webhook URL</label>
              <input type="url" value={cfg.globalWebhookUrl} placeholder="https://your-endpoint.com/webhook"
                onChange={e => set('globalWebhookUrl', e.target.value)}
                className={inputCls} />
              <p className="text-xs text-slate-400 mt-1">Receives all platform events. Leave empty to disable.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Slack Alert Webhook</label>
              <input type="url" value={cfg.slackAlertWebhook} placeholder="https://hooks.slack.com/..."
                onChange={e => set('slackAlertWebhook', e.target.value)}
                className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Toggle active={cfg.emailNotifications} onToggle={() => tog('emailNotifications')}
            label="Email Alerts" desc="Send critical platform alerts via email to the super admin account." />
          <Toggle active={cfg.slackNotifications} onToggle={() => tog('slackNotifications')}
            label="Slack Notifications" desc="Post alerts to the configured Slack webhook channel." />
        </Section>

        {/* Data & Backup */}
        <Section icon={Database} title="Data & Backup">
          <div className="mb-4">
            <Toggle active={cfg.autoBackup} onToggle={() => tog('autoBackup')}
              label="Automatic Backups" desc="Daily encrypted backup of all platform data to secure storage." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Backup Retention (days)
            </label>
            <input type="number" min={7} max={365} value={cfg.backupRetentionDays}
              onChange={e => set('backupRetentionDays', Number(e.target.value))}
              className={`${inputCls} max-w-xs`} />
          </div>
        </Section>

        {/* Security & Sessions */}
        <Section icon={Shield} title="Security & Sessions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Global Rate Limit (req/min)</label>
              <input type="number" value={cfg.rateLimitGlobal}
                onChange={e => set('rateLimitGlobal', Number(e.target.value))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Session Timeout (minutes)</label>
              <input type="number" value={cfg.sessionTimeoutMinutes}
                onChange={e => set('sessionTimeoutMinutes', Number(e.target.value))}
                className={inputCls} />
            </div>
          </div>
          <Toggle active={cfg.debugMode} onToggle={() => tog('debugMode')}
            label="Debug Mode" desc="Enables verbose logging and exposes additional diagnostic endpoints. Never enable in production." />
          {cfg.debugMode && (
            <div className="mt-3 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              Debug mode is active. This may expose sensitive information. Disable before production traffic.
            </div>
          )}
        </Section>

        {/* Tenant Limits */}
        <Section icon={Server} title="Tenant Capacity Limits">
          <p className="text-xs text-slate-400 mb-4">Maximum number of businesses allowed per plan tier. Set to 9999 for unlimited.</p>
          <div className="grid grid-cols-3 gap-4">
            {['starter', 'pro', 'enterprise'].map(plan => (
              <div key={plan}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 capitalize">{plan}</label>
                <input type="number" value={cfg.maxTenantsPerPlan[plan]}
                  onChange={e => setCfg(c => ({ ...c, maxTenantsPerPlan: { ...c.maxTenantsPerPlan, [plan]: Number(e.target.value) } }))}
                  className={inputCls} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
