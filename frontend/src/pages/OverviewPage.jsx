import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Phone, Activity, TrendingUp,
  AlertCircle, RefreshCw, Settings, Radio, ChevronRight,
} from 'lucide-react';
import client from '../api/client';

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white border border-z-border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs sm:text-sm text-z-muted font-medium">{label}</span>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${gradient} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl sm:text-4xl font-extrabold text-z-text">
        {value !== undefined ? value.toLocaleString() : <span className="text-z-muted text-2xl">—</span>}
      </p>
    </div>
  );
}

const QUICK_LINKS = [
  {
    to: '/dashboard/config',
    icon: Settings,
    label: 'AI Configuration',
    desc: 'Update your WhatsApp integration and system prompt',
    iconBg: 'bg-z-blue/10',
    iconColor: 'text-z-blue',
    border: 'hover:border-z-blue/40',
  },
  {
    to: '/dashboard/logs',
    icon: MessageSquare,
    label: 'Chat Logs',
    desc: 'Browse all customer interactions by channel',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'hover:border-emerald-300',
  },
  {
    to: '/dashboard/campaigns',
    icon: Radio,
    label: 'Campaigns',
    desc: 'Launch outbound AI cold-calling campaigns',
    iconBg: 'bg-z-purple/10',
    iconColor: 'text-z-purple',
    border: 'hover:border-z-purple/40',
  },
];

export default function OverviewPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  function load() {
    setLoading(true);
    setError('');
    client.get('/api/stats')
      .then(r => setStats(r.data))
      .catch(err => {
        if (!err.response) setError('Cannot reach the backend server.');
        else setError(err.response.data?.error || 'Failed to load stats.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Overview</h1>
          <p className="text-z-muted text-sm mt-0.5">Your AI automation at a glance</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-z-border rounded-xl text-sm text-z-muted hover:text-z-text hover:border-z-blue hover:shadow-sm transition-all disabled:opacity-40"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={load} className="underline underline-offset-2 whitespace-nowrap font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard icon={Activity}      label="Total Interactions" value={stats?.total}    gradient="bg-brand-gradient" />
        <StatCard icon={MessageSquare} label="WhatsApp Messages"  value={stats?.whatsapp} gradient="bg-emerald-500" />
        <StatCard icon={Phone}         label="Voice Calls"        value={stats?.voice}    gradient="bg-z-purple" />
        <StatCard icon={TrendingUp}    label="Today"              value={stats?.today}    gradient="bg-z-blue" />
      </div>

      {/* Channel split */}
      {stats && stats.total > 0 && (
        <div className="bg-white border border-z-border rounded-2xl p-5 sm:p-6 shadow-sm mb-8 sm:mb-10">
          <h2 className="text-sm sm:text-base font-semibold text-z-text mb-5">Channel Split</h2>
          <div className="space-y-5">
            {[
              { label: 'WhatsApp', value: stats.whatsapp, color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'Voice',    value: stats.voice,    color: 'bg-z-purple',    text: 'text-z-purple'   },
            ].map(({ label, value, color, text }) => {
              const pct = stats.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-z-text font-medium">{label}</span>
                    <span className={`font-semibold ${text}`}>{value.toLocaleString()} <span className="text-z-muted font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-z-surface rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center h-40 text-z-muted text-sm gap-2">
          <RefreshCw size={16} className="animate-spin text-z-blue" /> Loading stats…
        </div>
      )}

      {!loading && !error && stats?.total === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-z-muted text-sm gap-2 mb-8">
          <Activity size={32} className="opacity-30" />
          No interactions yet. Send a WhatsApp message to get started.
        </div>
      )}

      {/* Quick navigation */}
      <div>
        <h2 className="text-sm font-semibold text-z-muted uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, icon: Icon, label, desc, iconBg, iconColor, border }) => (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-4 bg-white border border-z-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md ${border} transition-all duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-z-text text-sm">{label}</p>
                <p className="text-xs text-z-muted mt-0.5 leading-relaxed line-clamp-2">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-z-muted group-hover:text-z-blue flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
