import { useState } from 'react';
import { TrendingUp, Users, Activity, CreditCard, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

const DAYS_OPTIONS = [7, 14, 30, 90];

const SIGNUP_DATA = [
  { day: 'Jun 22', signups: 4, interactions: 1820 },
  { day: 'Jun 23', signups: 7, interactions: 2340 },
  { day: 'Jun 24', signups: 3, interactions: 1950 },
  { day: 'Jun 25', signups: 9, interactions: 3100 },
  { day: 'Jun 26', signups: 5, interactions: 2600 },
  { day: 'Jun 27', signups: 11, interactions: 4200 },
  { day: 'Jun 28', signups: 8, interactions: 3800 },
];

const PLAN_REVENUE = [
  { plan: 'Starter',    tenants: 89, mrr: 89 * 29,  color: 'bg-slate-400' },
  { plan: 'Pro',        tenants: 42, mrr: 42 * 79,  color: 'bg-z-blue' },
  { plan: 'Enterprise', tenants: 11, mrr: 11 * 199, color: 'bg-z-purple' },
];

const totalMRR = PLAN_REVENUE.reduce((s, p) => s + p.mrr, 0);

const TOP_TENANTS = [
  { name: 'GrowthAgency Dubai',  plan: 'enterprise', interactions: 48200, status: 'active' },
  { name: 'NovaTech SaaS',        plan: 'enterprise', interactions: 31400, status: 'active' },
  { name: 'PropMax Realty',       plan: 'pro',        interactions: 22100, status: 'active' },
  { name: 'AutoDeal Cars',        plan: 'pro',        interactions: 18700, status: 'active' },
  { name: 'HealthFirst Clinic',   plan: 'starter',    interactions: 6400,  status: 'trial' },
];

const PLAN_CLS = {
  starter: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-50 text-blue-700',
  enterprise: 'bg-purple-50 text-purple-700',
};

function BarChart({ data, valueKey, color, maxLabel }) {
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-1.5 h-36">
      {data.map(d => {
        const pct = maxVal ? (d[valueKey] / maxVal) * 100 : 0;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
              <div
                className={`w-full ${color} rounded-t-md transition-all duration-500`}
                style={{ height: `${pct}%` }}
                title={`${d[valueKey]} ${valueKey}`}
              />
            </div>
            <span className="text-[9px] text-slate-400 whitespace-nowrap">{d.day.split(' ')[1]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SAAnalytics() {
  const [days, setDays] = useState(7);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Platform Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide growth and usage metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  days === d ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {d}d
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 hover:shadow-sm transition-all">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total MRR',       value: `$${totalMRR.toLocaleString()}`,  sub: '+8.2% vs last mo', up: true,  icon: CreditCard,  color: 'bg-emerald-500' },
          { label: 'New Signups',     value: '47',                              sub: `Last ${days} days`,  up: true,  icon: Users,       color: 'bg-z-blue' },
          { label: 'Total Interactions', value: '19.8K',                        sub: '+14% vs last period',up: true, icon: Activity,    color: 'bg-z-purple' },
          { label: 'Churn Rate',      value: '2.1%',                            sub: '−0.4% vs last mo',  up: false, icon: TrendingUp,  color: 'bg-amber-500' },
        ].map(({ label, value, sub, up, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={15} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
              {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Signups chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">New Business Signups</h2>
          <p className="text-xs text-slate-400 mb-4">Daily signups — last 7 days</p>
          <BarChart data={SIGNUP_DATA} valueKey="signups" color="bg-z-blue" />
        </div>

        {/* Interactions chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-1">Platform Interactions</h2>
          <p className="text-xs text-slate-400 mb-4">Daily volume across all tenants</p>
          <BarChart data={SIGNUP_DATA} valueKey="interactions" color="bg-z-purple" />
        </div>
      </div>

      {/* Revenue breakdown + top tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Revenue by plan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">MRR by Plan</h2>
          <div className="space-y-4">
            {PLAN_REVENUE.map(({ plan, tenants, mrr, color }) => {
              const pct = Math.round((mrr / totalMRR) * 100);
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{plan}</span>
                    <span className="text-sm font-bold text-slate-800">
                      ${mrr.toLocaleString()} <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{tenants} businesses</p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Total MRR</span>
            <span className="text-xl font-extrabold text-emerald-600">${totalMRR.toLocaleString()}</span>
          </div>
        </div>

        {/* Top tenants by usage */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Top Tenants by Usage</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {TOP_TENANTS.map((t, idx) => (
              <div key={t.name} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xs font-bold text-slate-300 w-5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.interactions.toLocaleString()} interactions</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_CLS[t.plan] || ''}`}>
                  {t.plan}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
