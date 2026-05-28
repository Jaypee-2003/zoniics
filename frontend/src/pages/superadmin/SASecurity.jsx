import { useState } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Clock, Eye,
  Key, Lock, LogIn, Activity, Globe, RefreshCw,
  Filter, Search, XCircle,
} from 'lucide-react';

const AUDIT_LOG = [
  { id: 1, actor: 'admin@zoniics.ai',     action: 'Super admin login',                    ip: '103.21.58.12',  status: 'success', time: '2 min ago',  type: 'auth' },
  { id: 2, actor: 'admin@zoniics.ai',     action: 'Suspended tenant: SpiceGarden Foods',   ip: '103.21.58.12',  status: 'success', time: '1h ago',     type: 'tenant' },
  { id: 3, actor: 'admin@zoniics.ai',     action: 'Updated AI temperature to 0.8',         ip: '103.21.58.12',  status: 'success', time: '3h ago',     type: 'settings' },
  { id: 4, actor: 'admin@zoniics.ai',     action: 'Plan updated: PropMax → Enterprise',    ip: '103.21.58.12',  status: 'success', time: '5h ago',     type: 'plan' },
  { id: 5, actor: 'unknown@attacker.com', action: 'Failed super admin login attempt',      ip: '198.51.100.42', status: 'failed',  time: '6h ago',     type: 'auth' },
  { id: 6, actor: 'unknown@attacker.com', action: 'Failed super admin login attempt',      ip: '198.51.100.42', status: 'failed',  time: '6h ago',     type: 'auth' },
  { id: 7, actor: 'admin@zoniics.ai',     action: 'Enabled maintenance mode',              ip: '103.21.58.12',  status: 'success', time: '1d ago',     type: 'settings' },
  { id: 8, actor: 'admin@zoniics.ai',     action: 'Created new Enterprise plan feature',   ip: '103.21.58.12',  status: 'success', time: '2d ago',     type: 'plan' },
  { id: 9, actor: 'admin@zoniics.ai',     action: 'Deleted tenant: TestCo Inc',            ip: '103.21.58.12',  status: 'success', time: '3d ago',     type: 'tenant' },
];

const TYPE_CONFIG = {
  auth:     { color: 'bg-blue-50 text-blue-700 border-blue-200',   icon: LogIn },
  tenant:   { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Eye },
  settings: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Activity },
  plan:     { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Key },
};

const STATUS_ALERTS = [
  { label: 'Failed Login Attempts (24h)', count: 2, severity: 'warning', icon: AlertTriangle },
  { label: 'Active Sessions', count: 1, severity: 'info', icon: Globe },
  { label: 'Platform Uptime', count: '99.9%', severity: 'success', icon: CheckCircle },
  { label: 'Last Backup', count: '2h ago', severity: 'success', icon: Clock },
];

export default function SASecurity() {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch]         = useState('');

  const filtered = AUDIT_LOG.filter(e => {
    const matchType   = filterType === 'all' || e.type === filterType;
    const matchSearch = !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.actor.includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Security & Audit</h1>
          <p className="text-slate-500 text-sm mt-0.5">All platform-level actions are logged and immutable</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 hover:shadow-sm transition-all">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {STATUS_ALERTS.map(({ label, count, severity, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border p-4 shadow-sm ${
            severity === 'warning' ? 'bg-amber-50 border-amber-200'
              : severity === 'success' ? 'bg-white border-slate-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <Icon size={16} className={
                severity === 'warning' ? 'text-amber-500'
                  : severity === 'success' ? 'text-emerald-500'
                  : 'text-blue-500'
              } />
            </div>
            <p className="text-xl font-extrabold text-slate-800">{count}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Failed login warning */}
      {AUDIT_LOG.filter(e => e.status === 'failed').length > 0 && (
        <div className="mb-5 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 text-sm">Security Alert</p>
            <p className="text-red-600 text-sm mt-0.5">
              {AUDIT_LOG.filter(e => e.status === 'failed').length} failed login attempts detected from IP <strong>198.51.100.42</strong> in the last 24 hours. Consider blocking this IP.
            </p>
          </div>
          <button className="ml-auto flex-shrink-0 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors">
            Block IP
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search audit log..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all" />
        </div>
        <div className="flex gap-2">
          {[['all','All'],['auth','Auth'],['tenant','Tenant'],['settings','Settings'],['plan','Plans']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterType === val
                  ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Audit Log</h2>
          <span className="text-xs text-slate-400">{filtered.length} entries</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map(event => {
            const tc  = TYPE_CONFIG[event.type] || TYPE_CONFIG.auth;
            const Icon = tc.icon;
            return (
              <div key={event.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color.split(' ').slice(0,2).join(' ')}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{event.action}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{event.actor}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400 font-mono">{event.ip}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${tc.color}`}>{event.type}</span>
                  {event.status === 'success'
                    ? <CheckCircle size={15} className="text-emerald-500" />
                    : <XCircle size={15} className="text-red-500" />}
                  <span className="text-xs text-slate-400 whitespace-nowrap">{event.time}</span>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Shield size={28} className="opacity-30 mb-2" />
            <p className="text-sm">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
