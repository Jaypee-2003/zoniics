import { useState, useEffect } from 'react';
import {
  Phone, PhoneOff, CheckCircle, XCircle, Clock, Bot,
  RefreshCw, Save, Loader, AlertCircle, Mic, Users,
} from 'lucide-react';
import client from '../api/client';

const OUTCOME_CONFIG = {
  interested:     { label: 'Interested',     bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  not_interested: { label: 'Not Interested', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     icon: XCircle },
  no_answer:      { label: 'No Answer',      bg: 'bg-z-surface',   text: 'text-z-muted',     border: 'border-z-border',    icon: PhoneOff },
  callback:       { label: 'Call Back',      bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   icon: Clock },
  completed:      { label: 'Completed',      bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    icon: CheckCircle },
};

const VOICE_OPTIONS = [
  'Female — Indian English (Natural)',
  'Male — Indian English (Natural)',
  'Female — American English',
  'Male — American English',
  'Female — British English',
  'Female — Hindi',
  'Male — Hindi',
];

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Arabic', 'Spanish', 'Portuguese',
  'English + Hindi (bilingual)',
];

const DEFAULT_CONFIG = {
  name: '',
  voice: 'Female — Indian English (Natural)',
  language: 'English',
  callTimeout: 30,
  maxRetries: 2,
};

function OutcomeBadge({ outcome }) {
  const c = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.no_answer;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

const inputCls = 'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

export default function VoicePage() {
  const [tab, setTab]         = useState('calls');
  const [calls, setCalls]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [config, setConfig]   = useState(DEFAULT_CONFIG);
  const [saved, setSaved]     = useState(false);

  function loadCalls() {
    setLoading(true);
    client.get('/api/interactions?channel=voice&limit=30')
      .then(r => setCalls(r.data.interactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCalls();
    client.get('/api/tenant')
      .then(r => {
        if (r.data.systemPrompt) {
          setConfig(c => ({ ...c, name: r.data.businessName || '' }));
        }
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  function handleSaveConfig() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tabs = [
    { key: 'calls',  label: 'Recent Calls' },
    { key: 'agent',  label: 'AI Agent' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Voice Calls</h1>
          <p className="text-z-muted text-sm mt-0.5">AI-powered inbound and outbound calling</p>
        </div>
        {tab === 'calls' && (
          <button onClick={loadCalls} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-z-border rounded-xl text-sm text-z-muted hover:text-z-text hover:shadow-sm transition-all disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-z-surface border border-z-border rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? 'bg-white text-z-text shadow-sm border border-z-border'
                : 'text-z-muted hover:text-z-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Recent Calls */}
      {tab === 'calls' && (
        <div className="bg-white border border-z-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-z-border flex items-center justify-between">
            <h2 className="font-bold text-z-text">Call History</h2>
            <span className="text-xs text-z-muted">{calls.length} calls</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-z-muted text-sm gap-2">
              <Loader size={16} className="animate-spin text-z-blue" /> Loading calls…
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-z-muted gap-3">
              <div className="w-16 h-16 rounded-2xl bg-z-surface border border-z-border flex items-center justify-center">
                <Phone size={28} className="opacity-30" />
              </div>
              <p className="text-sm font-medium">No calls yet</p>
              <p className="text-xs text-center max-w-64 leading-relaxed">
                Calls will appear here once your AI agent starts receiving or placing calls. Launch an outreach campaign to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-z-border">
              {calls.map(call => (
                <div key={call._id} className="px-5 py-4 hover:bg-z-surface/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-z-blue/10 flex items-center justify-center flex-shrink-0">
                        <Phone size={15} className="text-z-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-z-text truncate">
                          {call.from || call.to || 'Unknown'}
                        </p>
                        <p className="text-xs text-z-muted mt-0.5">
                          {new Date(call.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <OutcomeBadge outcome={call.outcome || 'completed'} />
                      {call.duration && (
                        <span className="text-xs text-z-muted font-mono">{call.duration}</span>
                      )}
                    </div>
                  </div>
                  {call.summary && (
                    <div className="mt-3 ml-12 flex items-start gap-2 text-xs text-z-muted bg-z-surface rounded-lg px-3 py-2">
                      <Bot size={12} className="flex-shrink-0 mt-0.5 text-z-blue" />
                      {call.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agent Config */}
      {tab === 'agent' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white border border-z-border rounded-2xl shadow-sm p-5 space-y-5">
            <h2 className="font-bold text-z-text flex items-center gap-2">
              <Bot size={17} className="text-z-purple" /> Voice Agent Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Agent Name</label>
                <input value={config.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Aria" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Voice</label>
                <select value={config.voice} onChange={e => set('voice', e.target.value)} className={inputCls}>
                  {VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Language</label>
                <select value={config.language} onChange={e => set('language', e.target.value)} className={inputCls}>
                  {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">
                  Ring Timeout (seconds)
                </label>
                <input type="number" min={10} max={120} value={config.callTimeout}
                  onChange={e => set('callTimeout', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">
                  Retry Attempts (no answer)
                </label>
                <input type="number" min={0} max={5} value={config.maxRetries}
                  onChange={e => set('maxRetries', Number(e.target.value))} className={inputCls} />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                  <CheckCircle size={15} /> Saved
                </span>
              )}
              <button onClick={handleSaveConfig}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-z-blue/20">
                <Save size={15} /> Save Agent Settings
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700 flex items-start gap-3">
            <Mic size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <span>
              <strong>Pro tip:</strong> For outbound calling campaigns, go to <strong>Outreach Campaigns</strong> to upload a CSV and start calling leads automatically.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
