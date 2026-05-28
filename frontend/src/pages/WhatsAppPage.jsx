import { useState, useEffect } from 'react';
import {
  MessageSquare, CheckCircle, Plus, Trash2,
  Zap, Bot, Clock, ArrowRight, X, RefreshCw, Loader,
} from 'lucide-react';
import client from '../api/client';

const DEFAULT_TEMPLATES = [
  {
    id: 1, name: 'Welcome Message', category: 'Greeting',
    body: 'Hi {{name}}! 👋 Welcome to {{business}}. How can I help you today?',
    active: true,
  },
  {
    id: 2, name: 'Appointment Reminder', category: 'Reminder',
    body: 'Hi {{name}}, reminder for your appointment tomorrow at {{time}}. Reply CONFIRM or RESCHEDULE.',
    active: true,
  },
  {
    id: 3, name: 'Follow-up', category: 'Follow-up',
    body: "Hi {{name}}, following up on our chat — are you still interested in {{product}}? Happy to help!",
    active: true,
  },
];

const DEFAULT_RULES = [
  { id: 1, trigger: 'First message from new contact',  action: 'Send welcome template',     active: true },
  { id: 2, trigger: 'Message contains "price"',        action: 'Share pricing info',        active: true },
  { id: 3, trigger: 'No reply for 24 hours',           action: 'Send follow-up template',   active: false },
  { id: 4, trigger: 'Message contains "appointment"',  action: 'Start booking flow',        active: false },
];

const STATUS_DOT = { connected: 'bg-emerald-500', disconnected: 'bg-red-500', connecting: 'bg-amber-400' };

export default function WhatsAppPage() {
  const [tab, setTab]           = useState('overview');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [rules, setRules]       = useState(DEFAULT_RULES);
  const [conversations, setConversations] = useState([]);
  const [convoLoading, setConvoLoading]   = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    client.get('/api/tenant').then(r => {
      setConnectionStatus(r.data.whatsappPhoneId ? 'connected' : 'disconnected');
    }).catch(() => {});

    setConvoLoading(true);
    client.get('/api/interactions?channel=whatsapp&limit=20')
      .then(r => setConversations(r.data.interactions || []))
      .catch(() => {})
      .finally(() => setConvoLoading(false));
  }, []);

  const toggleTemplate = id => setTemplates(ts => ts.map(t => t.id === id ? { ...t, active: !t.active } : t));
  const toggleRule = id => setRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'templates',  label: 'Templates' },
    { key: 'automation', label: 'Auto-Rules' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">WhatsApp</h1>
          <p className="text-z-muted text-sm mt-0.5">AI-powered WhatsApp automation for your business</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-z-border rounded-xl shadow-sm">
          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[connectionStatus]} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-semibold text-z-text capitalize">{connectionStatus}</span>
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="mb-5 flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <div className="flex items-start gap-3">
            <MessageSquare size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <span>Your WhatsApp number isn't connected yet. Go to <strong>My AI Agent</strong> to add your WhatsApp Phone Number ID.</span>
          </div>
          <a href="/dashboard/config" className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors">
            Connect <ArrowRight size={12} />
          </a>
        </div>
      )}

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

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Conversations', value: conversations.length, color: 'text-z-blue' },
              { label: 'Active Templates',    value: templates.filter(t => t.active).length, color: 'text-emerald-600' },
              { label: 'Auto-Rules Active',   value: rules.filter(r => r.active).length,     color: 'text-z-purple' },
              { label: 'Messages Today',      value: conversations.filter(c => {
                const today = new Date(); today.setHours(0,0,0,0);
                return new Date(c.createdAt) >= today;
              }).length, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-z-border rounded-2xl p-4 shadow-sm">
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-z-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent conversations */}
          <div className="bg-white border border-z-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-z-border flex items-center justify-between">
              <h2 className="font-bold text-z-text">Recent Conversations</h2>
              <span className="text-xs text-z-muted">{conversations.length} total</span>
            </div>

            {convoLoading ? (
              <div className="flex items-center justify-center py-12 text-z-muted text-sm gap-2">
                <Loader size={16} className="animate-spin text-z-blue" /> Loading…
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-z-muted gap-3">
                <div className="w-14 h-14 rounded-2xl bg-z-surface border border-z-border flex items-center justify-center">
                  <MessageSquare size={24} className="opacity-30" />
                </div>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs text-center max-w-64 leading-relaxed">
                  Once customers message your WhatsApp number, conversations will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-z-border">
                {conversations.map(c => (
                  <div key={c._id} className="flex items-center gap-4 px-5 py-4 hover:bg-z-surface/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(c.from || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-z-text truncate">{c.from || 'Unknown'}</p>
                      <p className="text-xs text-z-muted truncate">{c.message || c.summary || 'Message received'}</p>
                    </div>
                    <span className="text-xs text-z-muted whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-z-muted">Pre-written messages your AI sends automatically at the right moment</p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-gradient rounded-xl hover:opacity-90 shadow-sm">
              <Plus size={15} /> New Template
            </button>
          </div>

          {templates.map(t => (
            <div key={t.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${t.active ? 'border-z-border' : 'border-z-border opacity-60'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-z-text text-sm">{t.name}</p>
                    <span className="px-2 py-0.5 bg-z-surface text-z-muted text-[10px] font-semibold rounded-full border border-z-border">
                      {t.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleTemplate(t.id)}
                    className={`w-10 h-5.5 rounded-full relative transition-colors ${t.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    style={{ width: '40px', height: '22px' }}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${t.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <button className="p-1.5 text-z-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-z-muted bg-z-surface px-3 py-2 rounded-lg font-mono leading-relaxed">{t.body}</p>
              <p className="text-[10px] text-z-muted mt-2">
                Use <code className="bg-z-surface px-1 rounded font-mono">{'{{name}}'}</code>, <code className="bg-z-surface px-1 rounded font-mono">{'{{business}}'}</code>, <code className="bg-z-surface px-1 rounded font-mono">{'{{time}}'}</code> as placeholders
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Auto-Rules */}
      {tab === 'automation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-z-muted">Trigger automatic responses based on what your customers say or do</p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-gradient rounded-xl hover:opacity-90 shadow-sm">
              <Plus size={15} /> New Rule
            </button>
          </div>

          {rules.map(r => (
            <div key={r.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all ${r.active ? 'border-z-border' : 'border-z-border opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-z-muted uppercase tracking-widest">When</span>
                  <span className="px-2.5 py-1 bg-z-blue/8 text-z-blue text-xs font-semibold rounded-lg border border-z-blue/20">
                    {r.trigger}
                  </span>
                  <ArrowRight size={13} className="text-z-muted flex-shrink-0" />
                  <span className="text-xs font-bold text-z-muted uppercase tracking-widest">Then</span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                    {r.action}
                  </span>
                </div>
              </div>
              <button onClick={() => toggleRule(r.id)}
                className={`w-10 rounded-full relative flex-shrink-0 transition-colors`}
                style={{ width: '40px', height: '22px', background: r.active ? '#10b981' : '#cbd5e1' }}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}

          <div className="p-4 bg-z-surface border border-z-border rounded-2xl text-sm text-z-muted flex items-start gap-3">
            <Zap size={15} className="flex-shrink-0 mt-0.5 text-z-blue" />
            <span>
              Rules apply to all incoming WhatsApp messages in real time. Active rules run in order — the first matching rule wins.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
