import { useState } from 'react';
import {
  CreditCard, CheckCircle, ArrowUp, Clock, Download,
  Zap, Shield, AlertTriangle, ChevronRight, Star,
} from 'lucide-react';

const CURRENT_PLAN = {
  name: 'Pro',
  slug: 'pro',
  price: 79,
  billingCycle: 'monthly',
  nextBillingDate: '2025-07-01',
  status: 'active',
};

const USAGE = [
  { label: 'Messages Used', used: 14820, total: 20000, color: 'bg-z-blue' },
  { label: 'Voice Minutes', used: 312, total: 600, color: 'bg-z-purple' },
  { label: 'Team Seats',    used: 4,     total: 10,    color: 'bg-emerald-500' },
  { label: 'Active Workflows', used: 7,  total: 20,    color: 'bg-amber-500' },
];

const INVOICES = [
  { id: 'INV-2025-06', date: 'Jun 1, 2025',  amount: 79, status: 'paid' },
  { id: 'INV-2025-05', date: 'May 1, 2025',  amount: 79, status: 'paid' },
  { id: 'INV-2025-04', date: 'Apr 1, 2025',  amount: 79, status: 'paid' },
  { id: 'INV-2025-03', date: 'Mar 1, 2025',  amount: 79, status: 'paid' },
];

const PLANS = [
  {
    slug: 'starter', name: 'Starter', price: 29,
    features: ['2,000 messages/mo', 'Inbound WhatsApp', 'Basic analytics', '1 team seat'],
    color: 'border-slate-200',
  },
  {
    slug: 'pro', name: 'Pro', price: 79, current: true,
    features: ['20,000 messages/mo', 'Inbound + Outbound WhatsApp', 'Inbound voice calls', 'Advanced analytics', 'CRM integration', '10 team seats'],
    color: 'border-z-blue ring-2 ring-z-blue/20',
  },
  {
    slug: 'enterprise', name: 'Enterprise', price: 199,
    features: ['Unlimited messages', 'Full voice suite + CSV calling', 'Dedicated AI worker', 'Voice cloning', 'White-label', 'Custom AI persona'],
    color: 'border-z-purple',
  },
];

export default function BillingPage() {
  const [cycle, setCycle] = useState('monthly');

  const discount = cycle === 'yearly' ? 0.88 : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Billing & Plans</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your subscription and payment details</p>
      </div>

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

        {/* Current plan card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-z-blue to-z-purple rounded-2xl p-5 text-white shadow-lg shadow-z-blue/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-80">Current Plan</span>
            <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold capitalize">
              {CURRENT_PLAN.status}
            </span>
          </div>
          <p className="text-3xl font-extrabold mb-1">{CURRENT_PLAN.name}</p>
          <p className="text-4xl font-extrabold mb-1">${CURRENT_PLAN.price}<span className="text-lg font-normal opacity-70">/mo</span></p>
          <p className="text-xs opacity-70 mt-2">Next billing: {CURRENT_PLAN.nextBillingDate}</p>
          <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
            <button className="flex-1 py-2 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
              Change Plan
            </button>
            <button className="flex-1 py-2 text-xs font-bold bg-white text-z-blue hover:bg-white/90 rounded-xl transition-colors">
              Manage Billing
            </button>
          </div>
        </div>

        {/* Usage meters */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Monthly Usage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {USAGE.map(({ label, used, total, color }) => {
              const pct = Math.round((used / total) * 100);
              const warn = pct >= 80;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <span className={`text-xs font-bold ${warn ? 'text-amber-600' : 'text-slate-500'}`}>
                      {used.toLocaleString()} / {total === -1 ? '∞' : total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${warn ? 'bg-amber-400' : color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {warn && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> {pct}% used — consider upgrading
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Available Plans</h2>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {['monthly', 'yearly'].map(c => (
              <button key={c} onClick={() => setCycle(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  cycle === c ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}>
                {c}
                {c === 'yearly' && <span className="ml-1 text-emerald-600">−12%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ slug, name, price, current, features, color }) => (
            <div key={slug} className={`relative bg-white border rounded-2xl p-5 shadow-sm ${color}`}>
              {current && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-z-blue text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                  Current Plan
                </span>
              )}
              <p className="font-bold text-slate-800 text-lg mb-1">{name}</p>
              <p className="text-3xl font-extrabold text-slate-900 mb-0.5">
                ${Math.round(price * discount)}
                <span className="text-sm font-normal text-slate-400">/mo</span>
              </p>
              {cycle === 'yearly' && (
                <p className="text-xs text-emerald-600 mb-3">Billed ${Math.round(price * discount * 12)}/yr</p>
              )}
              <ul className="space-y-2 mt-4 mb-5">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  current
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : slug === 'enterprise'
                    ? 'bg-gradient-to-r from-z-blue to-z-purple text-white hover:opacity-90 shadow-lg shadow-z-blue/20'
                    : 'bg-z-blue/10 text-z-blue hover:bg-z-blue/15 border border-z-blue/20'
                }`}
                disabled={current}>
                {current ? 'Current Plan' : slug === 'enterprise' ? 'Upgrade to Enterprise' : `Switch to ${name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment method + invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Payment method */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">Payment Method</h2>
          <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl mb-4">
            <div className="w-10 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center">
              <CreditCard size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">•••• •••• •••• 4242</p>
              <p className="text-xs text-slate-400">Expires 08/27 · Visa</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              Default
            </span>
          </div>
          <button className="w-full py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all">
            + Add Payment Method
          </button>
        </div>

        {/* Invoice history */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Invoice History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {INVOICES.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{inv.id}</p>
                  <p className="text-xs text-slate-400">{inv.date}</p>
                </div>
                <span className="text-sm font-bold text-slate-700">${inv.amount}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 capitalize">
                  {inv.status}
                </span>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
