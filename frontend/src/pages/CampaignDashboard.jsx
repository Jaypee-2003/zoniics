import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, PhoneOff,
  Loader, AlertCircle, RefreshCw, Users,
} from 'lucide-react';
import client from '../api/client';

const COLUMNS = [
  {
    key:   'interested',
    label: 'Interested',
    icon:  CheckCircle,
    color: 'text-emerald-700',
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    dot:   'bg-emerald-500',
    card:  'hover:border-emerald-300',
  },
  {
    key:   'not_interested',
    label: 'Not Interested',
    icon:  XCircle,
    color: 'text-red-600',
    bg:    'bg-red-50',
    border:'border-red-200',
    dot:   'bg-red-500',
    card:  'hover:border-red-300',
  },
  {
    key:   'no_answer',
    label: 'No Answer',
    icon:  PhoneOff,
    color: 'text-z-muted',
    bg:    'bg-z-bg',
    border:'border-z-border',
    dot:   'bg-slate-400',
    card:  'hover:border-slate-400',
  },
];

function LeadCard({ lead, col }) {
  return (
    <div className={`bg-white border border-z-border rounded-xl p-3.5 ${col.card} transition-colors shadow-sm`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-z-text truncate">{lead.name}</p>
          <p className="text-xs text-z-muted font-mono mt-0.5">{lead.phone}</p>
          {lead.callSummary && (
            <p className="text-xs text-z-muted mt-2 leading-relaxed border-t border-z-border/60 pt-2 italic">
              "{lead.callSummary}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ col, leads }) {
  const Icon = col.icon;
  return (
    <div className="flex flex-col min-w-0">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-3 ${col.bg} ${col.border}`}>
        <Icon size={16} className={col.color} />
        <span className={`font-bold text-sm ${col.color}`}>{col.label}</span>
        <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {leads.length === 0 && (
          <p className="text-xs text-z-muted text-center py-10">No leads here yet</p>
        )}
        {leads.map(l => <LeadCard key={l._id} lead={l} col={col} />)}
      </div>
    </div>
  );
}

export default function CampaignDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leads, setLeads]       = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  function load() {
    setLoading(true); setError('');
    Promise.all([
      client.get('/api/campaigns'),
      client.get(`/api/campaigns/${id}/leads`),
    ])
      .then(([camRes, leadsRes]) => {
        setCampaign(camRes.data.find(c => c._id === id) || null);
        setLeads(leadsRes.data);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  const grouped = {
    interested:     leads.filter(l => l.leadOutcome === 'interested'),
    not_interested: leads.filter(l => l.leadOutcome === 'not_interested'),
    no_answer:      leads.filter(l => l.leadOutcome === 'no_answer' || l.leadOutcome === 'uncontacted'),
  };
  const total = leads.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/dashboard/campaigns')}
          className="flex items-center gap-1.5 text-z-muted hover:text-z-blue text-sm transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-z-text truncate">
            {campaign?.name ?? 'Campaign Results'}
          </h1>
          <p className="text-z-muted text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
            <Users size={12} /> {total} total leads
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-z-border rounded-xl text-sm text-z-muted hover:text-z-blue hover:border-z-blue hover:shadow-sm transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary metric cards */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {COLUMNS.map(col => {
            const count = grouped[col.key]?.length ?? 0;
            const pct   = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={col.key} className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm ${col.border}`}>
                <p className={`text-2xl sm:text-3xl font-extrabold ${col.color}`}>{count}</p>
                <p className="text-xs text-z-muted mt-0.5 font-medium">{col.label}</p>
                <div className="mt-3 h-2 bg-z-surface rounded-full overflow-hidden">
                  <div className={`h-full ${col.dot} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-z-muted mt-1.5 font-medium">{pct}%</p>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40 text-z-muted text-sm gap-2">
          <Loader size={16} className="animate-spin text-z-blue" /> Loading leads…
        </div>
      )}

      {/* Kanban — stacks on mobile, 3 cols on md+ */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {COLUMNS.map(col => (
            <Column key={col.key} col={col} leads={grouped[col.key] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
