import { useState } from 'react';
import {
  BrainCircuit, Save, CheckCircle, AlertTriangle,
  Mic, Globe, Zap, Settings, ToggleLeft, Bot,
  RefreshCw, Shield,
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  defaultSystemPrompt: 'You are a helpful, professional AI assistant representing the business. Be concise, friendly, and always try to qualify the customer\'s intent.',
  maxCallDurationSeconds: 300,
  maxCallRetries: 3,
  defaultVoice: 'Female — English (Natural)',
  defaultLanguage: 'English',
  aiModel: 'gpt-4o',
  temperature: 0.7,
  maxTokensPerTurn: 200,
  globalRateLimit: 1000,
  maintenanceMode: false,
  aiCostOptimization: true,
  autoSummarize: true,
  transcriptionEnabled: true,
  sentimentAnalysis: true,
};

const VOICE_OPTIONS = [
  'Female — English (Natural)', 'Male — English (Natural)',
  'Female — Hindi (Natural)', 'Male — Hindi (Natural)',
  'Female — Arabic', 'Female — Spanish', 'Female — Portuguese',
];

const AI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];

const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';
const selectCls = 'w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue transition-all';

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

export default function SAAIManagement() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved]       = useState(false);

  const set  = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const tog  = (k)    => setSettings(s => ({ ...s, [k]: !s[k] }));

  function handleSave() {
    // In production: saClient.put('/api/superadmin/settings', settings)
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">AI Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Global AI system configuration — Super Admin only</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle size={15} /> All changes saved
            </span>
          )}
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
            <Save size={15} />
            Save All
          </button>
        </div>
      </div>

      <div className="mb-5 p-3.5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        <Shield size={16} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Protected settings.</strong> These configurations control all AI behavior across every business on the platform.
          Changes take effect immediately for all tenants. Business Admins cannot access this section.
        </span>
      </div>

      <div className="space-y-5">
        {/* AI Model Config */}
        <Section icon={BrainCircuit} title="AI Model Configuration">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">AI Model</label>
              <select value={settings.aiModel} onChange={e => set('aiModel', e.target.value)} className={selectCls}>
                {AI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Temperature <span className="text-z-blue">{settings.temperature}</span>
              </label>
              <input type="range" min="0" max="1" step="0.05"
                value={settings.temperature}
                onChange={e => set('temperature', Number(e.target.value))}
                className="w-full accent-z-blue" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Precise (0)</span><span>Creative (1)</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Max Tokens / Turn</label>
              <input type="number" value={settings.maxTokensPerTurn}
                onChange={e => set('maxTokensPerTurn', Number(e.target.value))}
                className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Default System Prompt */}
        <Section icon={Bot} title="Default System Prompt">
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            This prompt is used as the base for all AI agents on the platform. Each business can extend but NOT override the core instructions.
          </p>
          <textarea value={settings.defaultSystemPrompt}
            onChange={e => set('defaultSystemPrompt', e.target.value)}
            rows={5}
            className={`${inputCls} resize-none font-mono text-xs`} />
        </Section>

        {/* Voice Settings */}
        <Section icon={Mic} title="Voice Agent Defaults">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Default Voice</label>
              <select value={settings.defaultVoice} onChange={e => set('defaultVoice', e.target.value)} className={selectCls}>
                {VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Max Call Duration (s)</label>
              <input type="number" value={settings.maxCallDurationSeconds}
                onChange={e => set('maxCallDurationSeconds', Number(e.target.value))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Max Call Retries</label>
              <input type="number" min={1} max={10} value={settings.maxCallRetries}
                onChange={e => set('maxCallRetries', Number(e.target.value))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Global Rate Limit (rpm)</label>
              <input type="number" value={settings.globalRateLimit}
                onChange={e => set('globalRateLimit', Number(e.target.value))}
                className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Feature Toggles */}
        <Section icon={Zap} title="AI Feature Toggles">
          <div>
            <Toggle active={settings.maintenanceMode}    onToggle={() => tog('maintenanceMode')}
              label="Maintenance Mode"        desc="Disables all API endpoints for scheduled maintenance. Users see a maintenance page." />
            <Toggle active={settings.aiCostOptimization} onToggle={() => tog('aiCostOptimization')}
              label="AI Cost Optimization"   desc="Automatically routes lower-priority tasks to cheaper models to reduce API spend." />
            <Toggle active={settings.autoSummarize}      onToggle={() => tog('autoSummarize')}
              label="Auto Summarization"     desc="Automatically generate call summaries and chat summaries after each interaction." />
            <Toggle active={settings.transcriptionEnabled} onToggle={() => tog('transcriptionEnabled')}
              label="Call Transcription"     desc="Enable real-time transcription for all voice calls across the platform." />
            <Toggle active={settings.sentimentAnalysis}  onToggle={() => tog('sentimentAnalysis')}
              label="Sentiment Analysis"     desc="Analyse conversation sentiment and flag negative experiences for review." />
          </div>
        </Section>
      </div>
    </div>
  );
}
