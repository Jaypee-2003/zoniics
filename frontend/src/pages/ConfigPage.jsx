import { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle, Loader, RefreshCw, Bot, Phone, MessageSquare, Shield } from 'lucide-react';
import client from '../api/client';

const TONES = ['Friendly & Warm', 'Professional', 'Direct & Assertive', 'Casual'];
const LANGUAGES = ['English', 'Hindi', 'Arabic', 'Spanish', 'Portuguese', 'English + Hindi'];

const inputCls =
  'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

function Section({ icon: Icon, iconBg, title, desc, children }) {
  return (
    <div className="bg-white border border-z-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-z-border bg-z-bg/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={17} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-z-text text-sm">{title}</p>
          {desc && <p className="text-xs text-z-muted">{desc}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function ConfigPage() {
  const [form, setForm] = useState({
    businessName: '',
    whatsappPhoneId: '',
    agentName: '',
    agentTone: 'Friendly & Warm',
    agentLanguage: 'English',
    systemPrompt: '',
  });
  const [status, setStatus]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');

  function fetchConfig() {
    setLoading(true);
    setLoadError('');
    client.get('/api/tenant')
      .then(r => {
        const { businessName = '', whatsappPhoneId = '', systemPrompt = '' } = r.data;
        setForm(f => ({ ...f, businessName, whatsappPhoneId, systemPrompt }));
      })
      .catch(err => {
        if (!err.response) setLoadError('Cannot reach the backend server. Is it running?');
        else setLoadError(err.response.data?.error || 'Failed to load configuration.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchConfig(); }, []);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setStatus(null); };

  async function handleSave(e) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const systemPrompt = form.systemPrompt ||
        `You are ${form.agentName || 'an AI assistant'}, a ${form.agentTone.toLowerCase()} AI agent representing ${form.businessName}. Communicate in ${form.agentLanguage}. Always be helpful and aim to understand the customer's needs.`;
      await client.put('/api/tenant', {
        businessName: form.businessName,
        whatsappPhoneId: form.whatsappPhoneId,
        systemPrompt,
      });
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      if (!err.response) setErrorMsg('Cannot reach the backend server.');
      else setErrorMsg(err.response.data?.error || 'Save failed. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-z-muted text-sm gap-2 p-8">
        <Loader size={18} className="animate-spin text-z-blue" /> Loading your agent…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="flex items-start gap-3 px-4 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Failed to load</p>
            <p className="text-red-500/80">{loadError}</p>
            <button onClick={fetchConfig} className="mt-3 flex items-center gap-1.5 text-red-500 underline underline-offset-2 text-xs">
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-z-text">My AI Agent</h1>
        <p className="text-z-muted text-sm mt-0.5">Customize how your AI agent interacts with your customers</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Business */}
        <Section icon={MessageSquare} iconBg="bg-emerald-500" title="Business Profile" desc="Your business identity shown to customers">
          <div>
            <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Business Name</label>
            <input value={form.businessName} onChange={e => set('businessName', e.target.value)}
              placeholder="Acme Corp" className={inputCls} />
          </div>
        </Section>

        {/* WhatsApp */}
        <Section icon={Phone} iconBg="bg-z-blue" title="WhatsApp Connection" desc="Link your WhatsApp Business number">
          <div>
            <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">WhatsApp Phone Number ID</label>
            <input value={form.whatsappPhoneId} onChange={e => set('whatsappPhoneId', e.target.value)}
              placeholder="e.g. 123456789012345"
              className={inputCls} />
            <p className="text-xs text-z-muted mt-1.5">
              Found in <span className="font-medium text-z-text">Meta Business Manager → WhatsApp → Phone Numbers</span>
            </p>
          </div>
        </Section>

        {/* Agent Personality */}
        <Section icon={Bot} iconBg="bg-z-purple" title="Agent Personality" desc="Shape how your AI agent communicates">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Agent Name</label>
              <input value={form.agentName} onChange={e => set('agentName', e.target.value)}
                placeholder="e.g. Aria, Max, Zara"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">Language</label>
              <select value={form.agentLanguage} onChange={e => set('agentLanguage', e.target.value)} className={inputCls}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-2">Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map(t => (
                <button key={t} type="button" onClick={() => set('agentTone', t)}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    form.agentTone === t
                      ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                      : 'bg-z-bg text-z-muted border-z-border hover:text-z-text'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5">
              What should your agent help customers with?
            </label>
            <textarea value={form.systemPrompt} onChange={e => set('systemPrompt', e.target.value)}
              rows={6}
              placeholder={`Example:\nYou help customers with product enquiries, pricing, and booking appointments. Always ask for their name first. If someone wants to buy, collect their contact details and tell them a sales rep will call within 2 hours.`}
              className={`${inputCls} resize-y leading-relaxed`} />
            <p className="text-xs text-z-muted mt-1.5">
              Write in plain language. Your AI will follow these instructions in every conversation.
            </p>
          </div>
        </Section>

        {/* Platform notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-700">
          <Shield size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
          <p>Core AI model settings (response quality, speed, cost optimization) are managed by the platform to ensure the best experience for all businesses.</p>
        </div>

        {status === 'saved' && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Agent configuration saved successfully.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <button type="submit" disabled={status === 'saving'}
          className="flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-z-blue/20">
          {status === 'saving'
            ? <><Loader size={16} className="animate-spin" />Saving…</>
            : <><Save size={16} />Save Agent Settings</>}
        </button>
      </form>
    </div>
  );
}
