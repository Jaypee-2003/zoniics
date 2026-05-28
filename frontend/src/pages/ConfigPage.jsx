import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import client from '../api/client';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-z-text mb-1">{label}</label>
      {hint && <p className="text-xs text-z-muted mb-2 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

export default function ConfigPage() {
  const [form, setForm]           = useState({ businessName: '', whatsappPhoneId: '', openAiKey: '', systemPrompt: '' });
  const [showKey, setShowKey]     = useState(false);
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
        setForm({ businessName, whatsappPhoneId, openAiKey: '', systemPrompt });
      })
      .catch(err => {
        if (!err.response) setLoadError('Cannot reach the backend server. Is it running?');
        else setLoadError(err.response.data?.error || 'Failed to load configuration.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchConfig(); }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setStatus(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const payload = { ...form };
      if (!payload.openAiKey) delete payload.openAiKey;
      await client.put('/api/tenant', payload);
      setStatus('saved');
      setForm(f => ({ ...f, openAiKey: '' }));
    } catch (err) {
      setStatus('error');
      if (!err.response) setErrorMsg('Cannot reach the backend server.');
      else setErrorMsg(err.response.data?.error || 'Save failed. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-z-muted text-sm gap-2 p-8">
        <Loader size={18} className="animate-spin text-z-blue" /> Loading config…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="flex items-start gap-3 px-4 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Failed to load configuration</p>
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
        <h1 className="text-xl sm:text-2xl font-bold text-z-text">AI Configuration</h1>
        <p className="text-z-muted text-sm mt-1">Manage your WhatsApp integration and AI behaviour</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
        {/* Business info */}
        <div className="bg-white border border-z-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-xs font-semibold text-z-muted uppercase tracking-widest">Business</h2>

          <Field label="Business Name">
            <input name="businessName" value={form.businessName} onChange={handleChange}
              placeholder="Acme Corp" className={inputCls} />
          </Field>

          <Field label="WhatsApp Phone Number ID"
            hint="Found in Meta Business Manager → WhatsApp → Phone Numbers">
            <input name="whatsappPhoneId" value={form.whatsappPhoneId} onChange={handleChange}
              placeholder="123456789012345" className={inputCls} />
          </Field>
        </div>

        {/* OpenAI */}
        <div className="bg-white border border-z-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-xs font-semibold text-z-muted uppercase tracking-widest">OpenAI</h2>

          <Field label="OpenAI API Key" hint="Leave blank to keep your existing key.">
            <div className="relative">
              <input name="openAiKey" type={showKey ? 'text' : 'password'}
                value={form.openAiKey} onChange={handleChange}
                placeholder="sk-proj-••••••••••••" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-z-muted hover:text-z-text p-1 rounded">
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>

        {/* System Prompt */}
        <div className="bg-white border border-z-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-xs font-semibold text-z-muted uppercase tracking-widest">AI Behaviour</h2>

          <Field label="System Prompt"
            hint="Your AI's persona. Be specific — include tone, scope, and any rules.">
            <textarea name="systemPrompt" value={form.systemPrompt} onChange={handleChange}
              rows={10} placeholder="You are a friendly customer support agent for Acme Corp…"
              className={`${inputCls} resize-y leading-relaxed`} />
            <p className="text-right text-xs text-z-muted mt-1.5">{form.systemPrompt.length} characters</p>
          </Field>
        </div>

        {/* Status */}
        {status === 'saved' && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Configuration saved successfully.
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
            : <><Save size={16} />Save Configuration</>}
        </button>
      </form>
    </div>
  );
}
