import { useState } from 'react';
import { CheckCircle, X, Edit3, Save, AlertTriangle } from 'lucide-react';

const DEFAULT_PLANS = [
  {
    slug: 'starter', name: 'Starter', sortOrder: 1,
    priceMonthly: 29, priceYearly: 279,
    requestsPerMinute: 50, messagesPerMonth: 2000,
    features: {
      inboundWhatsApp: true, outboundWhatsApp: false,
      inboundVoice: false, outboundVoice: false,
      csvColdCalling: false, priorityQueue: false,
      dedicatedWorker: false, campaignDashboard: false,
      crmIntegration: false, analyticsAdvanced: false,
      teamMembers: false, customAiPersona: false,
      voiceCloning: false, whitelabel: false,
    },
    tenants: 89,
  },
  {
    slug: 'pro', name: 'Pro', sortOrder: 2,
    priceMonthly: 79, priceYearly: 759,
    requestsPerMinute: 200, messagesPerMonth: 20000,
    features: {
      inboundWhatsApp: true, outboundWhatsApp: true,
      inboundVoice: true, outboundVoice: false,
      csvColdCalling: false, priorityQueue: true,
      dedicatedWorker: false, campaignDashboard: true,
      crmIntegration: true, analyticsAdvanced: true,
      teamMembers: true, customAiPersona: false,
      voiceCloning: false, whitelabel: false,
    },
    tenants: 42,
  },
  {
    slug: 'enterprise', name: 'Enterprise', sortOrder: 3,
    priceMonthly: 199, priceYearly: 1919,
    requestsPerMinute: 1000, messagesPerMonth: -1,
    features: {
      inboundWhatsApp: true, outboundWhatsApp: true,
      inboundVoice: true, outboundVoice: true,
      csvColdCalling: true, priorityQueue: true,
      dedicatedWorker: true, campaignDashboard: true,
      crmIntegration: true, analyticsAdvanced: true,
      teamMembers: true, customAiPersona: true,
      voiceCloning: true, whitelabel: true,
    },
    tenants: 11,
  },
];

const FEATURE_LABELS = {
  inboundWhatsApp:   'Inbound WhatsApp',
  outboundWhatsApp:  'Outbound WhatsApp',
  inboundVoice:      'Inbound Voice Calls',
  outboundVoice:     'Outbound Voice Calls',
  csvColdCalling:    'CSV Cold Calling',
  priorityQueue:     'Priority Queue',
  dedicatedWorker:   'Dedicated AI Worker',
  campaignDashboard: 'Campaign Dashboard',
  crmIntegration:    'CRM Integration',
  analyticsAdvanced: 'Advanced Analytics',
  teamMembers:       'Team Members',
  customAiPersona:   'Custom AI Persona',
  voiceCloning:      'Voice Cloning',
  whitelabel:        'White-label',
};

const SLUG_COLORS = {
  starter:    { badge: 'bg-slate-100 text-slate-700',    header: 'bg-slate-50 border-slate-200' },
  pro:        { badge: 'bg-blue-50 text-blue-700',       header: 'bg-blue-50/50 border-blue-200' },
  enterprise: { badge: 'bg-purple-50 text-purple-700',   header: 'bg-purple-50/50 border-purple-200' },
};

function PlanCard({ plan: initialPlan, onSave }) {
  const [plan, setPlan]     = useState(initialPlan);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]   = useState(false);
  const c = SLUG_COLORS[plan.slug] || SLUG_COLORS.starter;

  const set = (k, v) => setPlan(p => ({ ...p, [k]: v }));
  const setFeature = (k, v) => setPlan(p => ({ ...p, features: { ...p.features, [k]: v } }));

  function handleSave() {
    onSave(plan);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${c.header.split(' ')[1]}`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${c.header}`}>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${c.badge}`}>{plan.slug}</span>
          <span className="font-bold text-slate-800 text-lg">{plan.name}</span>
          <span className="text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">
            {plan.tenants} businesses
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          {editing
            ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-lg hover:opacity-90 transition-opacity">
                  <Save size={13} /> Save
                </button>
              </div>
            )
            : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                <Edit3 size={13} /> Edit
              </button>
            )}
        </div>
      </div>

      <div className="p-5">
        {/* Pricing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 pb-5 border-b border-slate-100">
          {[
            { label: 'Monthly Price ($)', key: 'priceMonthly', type: 'number' },
            { label: 'Yearly Price ($)',  key: 'priceYearly',  type: 'number' },
            { label: 'Req / Minute',      key: 'requestsPerMinute', type: 'number' },
            { label: 'Messages / Month',  key: 'messagesPerMonth',  type: 'number', hint: '-1 = unlimited' },
          ].map(({ label, key, hint }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
              {editing
                ? (
                  <input type="number" value={plan[key]} onChange={e => set(key, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-z-blue transition-all" />
                )
                : (
                  <p className="text-lg font-extrabold text-slate-800">
                    {plan[key] === -1 ? '∞' : plan[key].toLocaleString()}
                    {hint && <span className="text-xs font-normal text-slate-400 ml-1">{hint}</span>}
                  </p>
                )}
            </div>
          ))}
        </div>

        {/* Features */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Features</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => {
            const on = plan.features[key];
            return (
              <div key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  on
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                {on
                  ? <CheckCircle size={12} className="flex-shrink-0 text-emerald-500" />
                  : <X size={12} className="flex-shrink-0 text-slate-300" />}
                <span className="truncate">{label}</span>
                {editing && (
                  <button
                    onClick={() => setFeature(key, !on)}
                    className="ml-auto flex-shrink-0 w-5 h-5 rounded-md border border-current flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                    {on ? <X size={10} /> : <CheckCircle size={10} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SAPlans() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  function handleSave(updatedPlan) {
    setPlans(ps => ps.map(p => p.slug === updatedPlan.slug ? updatedPlan : p));
    // In production: saClient.put(`/api/superadmin/plans/${updatedPlan.slug}`, updatedPlan)
  }

  const totalRevenueMRR = plans.reduce((sum, p) => sum + p.priceMonthly * p.tenants, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Plan Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure pricing and features for each subscription tier</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div>
            <p className="text-xs text-slate-400">Est. MRR</p>
            <p className="text-lg font-extrabold text-emerald-600">${totalRevenueMRR.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 p-3.5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Caution:</strong> Changes to plan features affect all businesses on that plan immediately.
          Removing features from an existing plan will revoke access for current subscribers.
        </span>
      </div>

      <div className="space-y-5">
        {plans.map(plan => (
          <PlanCard key={plan.slug} plan={plan} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}
