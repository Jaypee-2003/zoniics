import { useState, useEffect } from 'react';
import {
  TrendingUp, Phone, MessageSquare, CheckCircle,
  Clock, Zap, RefreshCw, BarChart2, Activity, Loader,
} from 'lucide-react';
import client from '../api/client';

const RANGE_OPTIONS = ['7 days', '30 days', '90 days', 'All time'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30 days');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    client.get('/api/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [range]);

  const hasData = stats && stats.total > 0;

  const KPI_CARDS = [
    { label: 'Total Calls',         value: stats?.voice ?? 0,    icon: Phone,         gradient: 'from-z-blue to-blue-400' },
    { label: 'WhatsApp Messages',   value: stats?.whatsapp ?? 0, icon: MessageSquare, gradient: 'from-emerald-500 to-emerald-400' },
    { label: 'Total Interactions',  value: stats?.total ?? 0,    icon: Activity,      gradient: 'from-z-purple to-purple-400' },
    { label: 'Today',               value: stats?.today ?? 0,    icon: Zap,           gradient: 'from-amber-500 to-amber-400' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Analytics</h1>
          <p className="text-z-muted text-sm mt-0.5">Performance across your AI voice calls and WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-z-surface border border-z-border rounded-xl gap-1">
            {RANGE_OPTIONS.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  range === r ? 'bg-white text-z-text shadow-sm border border-z-border' : 'text-z-muted hover:text-z-text'
                }`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-z-border rounded-xl text-sm text-z-muted hover:shadow-sm transition-all disabled:opacity-40">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {KPI_CARDS.map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className="bg-white border border-z-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-z-muted font-medium">{label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
                <Icon size={16} className="text-white" />
              </div>
            </div>
            {loading
              ? <div className="h-8 bg-z-surface rounded-lg animate-pulse w-20" />
              : <p className="text-3xl font-extrabold text-z-text">{value.toLocaleString()}</p>
            }
          </div>
        ))}
      </div>

      {!loading && !hasData ? (
        /* Empty state */
        <div className="bg-white border border-z-border rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-z-muted gap-4">
            <div className="w-20 h-20 rounded-2xl bg-z-surface border border-z-border flex items-center justify-center">
              <BarChart2 size={36} className="opacity-20" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-z-text text-base mb-1">No data yet</p>
              <p className="text-sm max-w-sm leading-relaxed">
                Analytics will appear once your AI agent starts handling calls and WhatsApp messages.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <a href="/dashboard/voice"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 shadow-sm">
                <Phone size={14} /> Set up Voice Calls
              </a>
              <a href="/dashboard/whatsapp"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-z-blue bg-z-blue/8 border border-z-blue/20 rounded-xl hover:bg-z-blue/12 transition-colors">
                <MessageSquare size={14} /> Connect WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Data views */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Channel split */}
          <div className="bg-white border border-z-border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-z-text mb-4">Channel Split</h2>
            {loading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-8 bg-z-surface rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Voice Calls',      value: stats?.voice,    color: 'bg-z-blue',    text: 'text-z-blue' },
                  { label: 'WhatsApp Messages',value: stats?.whatsapp, color: 'bg-emerald-500',text: 'text-emerald-600' },
                ].map(({ label, value, color, text }) => {
                  const pct = stats?.total ? Math.round(((value || 0) / stats.total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-z-text font-medium">{label}</span>
                        <span className={`font-semibold ${text}`}>
                          {(value || 0).toLocaleString()} <span className="text-z-muted font-normal text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-z-surface rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity summary */}
          <div className="bg-white border border-z-border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-z-text mb-4">Activity Summary</h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-z-surface rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Total AI Interactions', value: stats?.total?.toLocaleString() ?? '0', icon: Activity, color: 'text-z-blue bg-z-blue/10' },
                  { label: 'Interactions Today',    value: stats?.today?.toLocaleString() ?? '0', icon: Zap,      color: 'text-amber-600 bg-amber-50' },
                  { label: 'Voice / WhatsApp Ratio', value: stats?.voice && stats?.whatsapp
                    ? `${stats.voice} : ${stats.whatsapp}`
                    : '—', icon: TrendingUp, color: 'text-z-purple bg-purple-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-4 p-3.5 bg-z-surface rounded-xl border border-z-border">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-z-muted">{label}</p>
                      <p className="text-lg font-extrabold text-z-text">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
