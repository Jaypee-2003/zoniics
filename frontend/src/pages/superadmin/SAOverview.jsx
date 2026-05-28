import { useState, useEffect } from 'react';
import {
  Users, Activity, TrendingUp, TrendingDown, CreditCard,
  AlertTriangle, CheckCircle, Clock, RefreshCw, BarChart2,
  Zap, Shield, BrainCircuit, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import saClient from '../../api/saClient';

const MOCK_OVERVIEW = {
  businesses: { total: 142, active: 118, suspended: 6, trial: 18, newThisMonth: 14 },
  interactions: { total: 1284920, today: 8421 },
  planBreakdown: { starter: 89, pro: 42, enterprise: 11 },
};

const RECENT_SIGNUPS = [
  { name: 'PropMax Realty',     email: 'admin@propmax.in',   plan: 'pro',        status: 'active',    time: '2h ago' },
  { name: 'HealthFirst Clinic', email: 'hello@healthfirst.in', plan: 'starter',  status: 'trial',     time: '5h ago' },
  { name: 'GrowthAgency Dubai', email: 'ops@growthagency.ae', plan: 'enterprise',status: 'active',    time: '1d ago' },
  { name: 'SpiceGarden Foods',  email: 'tech@spicegarden.com',plan: 'starter',   status: 'suspended', time: '2d ago' },
];

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial:     'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
};

const PLAN_COLORS = {
  starter:    'bg-slate-100 text-slate-600',
  pro:        'bg-z-blue/10 text-z-blue',
  enterprise: 'bg-z-purple/10 text-z-purple',
};

function KPICard({ icon: Icon, label, value, sub, subUp, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-slate-800 mb-1">{value}</p>
      {sub && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${subUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {subUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

export default function SAOverview() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    saClient.get('/api/superadmin/overview')
      .then(r => setData(r.data))
      .catch(() => setData(MOCK_OVERVIEW))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const d = data || MOCK_OVERVIEW;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Platform Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time platform health across all tenants</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all disabled:opacity-40">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <KPICard icon={Users}     label="Total Businesses" value={d.businesses.total.toLocaleString()} sub="+14 this month" subUp={true}  color="bg-z-blue" />
        <KPICard icon={CheckCircle}label="Active"          value={d.businesses.active.toLocaleString()} sub={`${d.businesses.suspended} suspended`} subUp={false} color="bg-emerald-500" />
        <KPICard icon={Activity}  label="Total Interactions" value={d.interactions.total.toLocaleString()} sub="+8,421 today" subUp={true} color="bg-z-purple" />
        <KPICard icon={Clock}     label="On Trial"         value={d.businesses.trial.toLocaleString()}  sub="Convert to paid" subUp={true} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-6">

        {/* Plan breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Plan Distribution</h2>
          <div className="space-y-4">
            {[
              { key: 'starter',    label: 'Starter',    color: 'bg-slate-400' },
              { key: 'pro',        label: 'Pro',        color: 'bg-z-blue' },
              { key: 'enterprise', label: 'Enterprise', color: 'bg-z-purple' },
            ].map(({ key, label, color }) => {
              const count = d.planBreakdown[key] || 0;
              const pct   = d.businesses.total ? Math.round((count / d.businesses.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span className="text-sm font-bold text-slate-800">{count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link to="/superadmin/businesses" className="flex items-center gap-2 text-xs font-semibold text-z-blue hover:underline">
              Manage all businesses <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/superadmin/businesses', icon: Users,       label: 'View all businesses',     desc: 'Manage accounts and subscriptions' },
              { to: '/superadmin/plans',      icon: CreditCard,  label: 'Edit plan pricing',        desc: 'Update plan features and limits' },
              { to: '/superadmin/ai',         icon: BrainCircuit,label: 'AI configuration',         desc: 'Global AI model settings' },
              { to: '/superadmin/security',   icon: Shield,      label: 'Security audit log',       desc: 'Review access and activity' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-z-blue/10 transition-colors">
                  <Icon size={16} className="text-slate-500 group-hover:text-z-blue transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 truncate">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-z-blue flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Status summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Account Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Active',    count: d.businesses.active,    color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
              { label: 'On Trial',  count: d.businesses.trial,     color: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700' },
              { label: 'Pending',   count: 0,                      color: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700' },
              { label: 'Suspended', count: d.businesses.suspended, color: 'bg-red-500',     badge: 'bg-red-50 text-red-700' },
            ].map(({ label, count, color, badge }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-slate-600 font-medium">{label}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge}`}>{count}</span>
              </div>
            ))}
          </div>
          {d.businesses.suspended > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600 font-medium">
              <AlertTriangle size={13} />
              {d.businesses.suspended} accounts need review
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Business Signups</h2>
          <Link to="/superadmin/businesses" className="text-xs text-z-blue hover:underline font-medium">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Business', 'Email', 'Plan', 'Status', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_SIGNUPS.map(({ name, email, plan, status, time }) => (
                <tr key={email} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {name[0]}
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_COLORS[plan] || ''}`}>{plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[status] || ''}`}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
