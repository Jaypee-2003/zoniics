import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, UploadCloud, Play, BarChart2, Users,
  CheckCircle, XCircle, PhoneOff, Loader, AlertCircle, ChevronRight,
} from 'lucide-react';
import client from '../api/client';

const inputCls =
  'w-full bg-z-bg border border-z-border text-z-text placeholder-z-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all';

function StatusBadge({ status }) {
  const map = {
    draft:     'bg-slate-100 text-slate-600 border-slate-200',
    active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused:    'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}

function CampaignCard({ campaign, onUpload, onLaunch, onView }) {
  const s = campaign.stats || {};
  return (
    <div className="bg-white border border-z-border rounded-2xl p-5 hover:shadow-md hover:border-z-blue/30 transition-all duration-200 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className="font-bold text-z-text truncate">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-xs text-z-muted truncate">{campaign.description}</p>
          )}
        </div>
        <button
          onClick={() => onView(campaign._id)}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-z-blue hover:underline font-medium whitespace-nowrap"
        >
          Results <ChevronRight size={13} />
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        <span className="flex items-center gap-1 text-xs text-z-muted font-medium"><Users size={12} />{s.total ?? 0} leads</span>
        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={12} />{s.interested ?? 0} interested</span>
        <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} />{s.not_interested ?? 0} not interested</span>
        <span className="flex items-center gap-1 text-xs text-z-muted font-medium"><PhoneOff size={12} />{s.no_answer ?? 0} no answer</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-z-bg border border-z-border rounded-lg text-z-muted hover:text-z-blue hover:border-z-blue hover:bg-blue-50 cursor-pointer transition-all">
          <UploadCloud size={13} /> Upload CSV
          <input
            type="file" accept=".csv" className="hidden"
            onChange={e => e.target.files[0] && onUpload(campaign._id, e.target.files[0])}
          />
        </label>
        {s.uncontacted > 0 && (
          <button
            onClick={() => onLaunch(campaign._id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Play size={13} /> Launch ({s.uncontacted})
          </button>
        )}
      </div>
    </div>
  );
}

function CreateModal({ onCreated, onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', vapiPhoneNumberId: '',
    systemPromptTemplate: "You are a friendly sales agent calling {{name}}. Introduce yourself, explain the offer briefly, and ask if they're interested.",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/api/campaigns', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white border border-z-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-z-border flex-shrink-0">
          <h2 className="font-bold text-z-text">New Campaign</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface text-xl leading-none transition-colors">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5 block">Campaign Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Q3 Outreach" className={inputCls} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5 block">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Optional notes" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5 block">Caller Phone Number ID *</label>
            <input value={form.vapiPhoneNumberId} onChange={e => set('vapiPhoneNumberId', e.target.value)}
              placeholder="Your outbound phone number ID from Vapi" className={inputCls} required />
            <p className="text-xs text-z-muted mt-1">Found in your Vapi dashboard under Phone Numbers</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-1.5 block">
              AI System Prompt Template *
            </label>
            <p className="text-xs text-z-muted mb-2">Use <code className="bg-z-surface px-1.5 py-0.5 rounded font-mono">{'{{name}}'}</code> and <code className="bg-z-surface px-1.5 py-0.5 rounded font-mono">{'{{phone}}'}</code> as placeholders.</p>
            <textarea value={form.systemPromptTemplate} onChange={e => set('systemPromptTemplate', e.target.value)}
              rows={5} className={`${inputCls} resize-y`} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm text-z-muted hover:text-z-text border border-z-border rounded-xl hover:border-z-blue transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-gradient text-white rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md shadow-z-blue/20">
              {saving ? <><Loader size={14} className="animate-spin" />Creating…</> : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast]           = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  function load() {
    setLoading(true); setError('');
    client.get('/api/campaigns')
      .then(r => setCampaigns(r.data))
      .catch(err => setError(err.response?.data?.error || 'Cannot load campaigns.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(campaignId, file) {
    const fd = new FormData();
    fd.append('csv', file);
    try {
      const { data } = await client.post(`/api/campaigns/${campaignId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(`Uploaded ${data.inserted} leads`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    }
  }

  async function handleLaunch(campaignId) {
    try {
      const { data } = await client.post(`/api/campaigns/${campaignId}/launch`);
      showToast(`${data.queued} calls queued`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Launch failed.');
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Outreach Campaigns</h1>
          <p className="text-z-muted text-sm mt-0.5">AI cold calling — upload a CSV of leads and your agent calls each one automatically</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-md shadow-z-blue/20 transition-opacity"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40 text-z-muted text-sm gap-2">
          <Loader size={16} className="animate-spin text-z-blue" /> Loading campaigns…
        </div>
      )}

      {!loading && campaigns.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center h-48 text-z-muted text-sm gap-3">
          <div className="w-16 h-16 rounded-2xl bg-z-surface border border-z-border flex items-center justify-center">
            <BarChart2 size={28} className="opacity-30" />
          </div>
          <p className="font-medium text-z-text text-sm">No campaigns yet</p>
          <p className="text-xs text-center max-w-64 leading-relaxed">Create a campaign, upload a CSV of leads, and your AI agent will call each contact automatically.</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gradient text-white text-sm font-semibold rounded-lg hover:opacity-90">
            <Plus size={14} /> New Campaign
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map(c => (
          <CampaignCard
            key={c._id}
            campaign={c}
            onUpload={handleUpload}
            onLaunch={handleLaunch}
            onView={id => navigate(`/dashboard/campaigns/${id}`)}
          />
        ))}
      </div>

      {showCreate && (
        <CreateModal
          onCreated={() => { setShowCreate(false); load(); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-4 sm:right-6 flex items-center gap-2 px-4 py-3 bg-white border border-emerald-200 rounded-2xl text-emerald-700 text-sm shadow-xl shadow-emerald-100 z-50">
          <CheckCircle size={15} className="text-emerald-500" />{toast}
        </div>
      )}
    </div>
  );
}
