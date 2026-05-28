import { useState, useEffect } from 'react';
import {
  Search, Filter, MoreHorizontal, CheckCircle, XCircle, Clock,
  Users, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle,
  Eye, Ban, CreditCard, Trash2, X,
} from 'lucide-react';
import saClient from '../../api/saClient';

const STATUS_CONFIG = {
  active:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  trial:     { label: 'Trial',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  suspended: { label: 'Suspended', cls: 'bg-red-50 text-red-700 border-red-200' },
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PLAN_CLS = {
  starter:    'bg-slate-100 text-slate-600 border-slate-200',
  pro:        'bg-blue-50 text-blue-700 border-blue-200',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
};

const MOCK = [
  { _id: '1', businessName: 'PropMax Realty',     email: 'admin@propmax.in',      plan: 'pro',        status: 'active',    createdAt: '2025-04-15', isActive: true },
  { _id: '2', businessName: 'HealthFirst Clinic',  email: 'hello@healthfirst.in',  plan: 'starter',    status: 'trial',     createdAt: '2025-05-21', isActive: true },
  { _id: '3', businessName: 'GrowthAgency Dubai',  email: 'ops@growthagency.ae',   plan: 'enterprise', status: 'active',    createdAt: '2025-03-08', isActive: true },
  { _id: '4', businessName: 'SpiceGarden Foods',   email: 'tech@spicegarden.com',  plan: 'starter',    status: 'suspended', createdAt: '2025-02-12', isActive: false },
  { _id: '5', businessName: 'AutoDeal Cars',        email: 'hello@autodeal.in',     plan: 'pro',        status: 'active',    createdAt: '2025-05-01', isActive: true },
  { _id: '6', businessName: 'QuickFix Services',   email: 'info@quickfix.com',     plan: 'starter',    status: 'trial',     createdAt: '2025-05-24', isActive: true },
  { _id: '7', businessName: 'NovaTech SaaS',        email: 'admin@novatech.io',     plan: 'enterprise', status: 'active',    createdAt: '2025-01-30', isActive: true },
];

function ActionModal({ business, onClose, onAction }) {
  const [newStatus, setNewStatus] = useState(business.status);
  const [newPlan, setNewPlan]     = useState(business.plan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Manage: {business.businessName}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Account Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-z-blue transition-all">
              {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Subscription Plan</label>
            <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-z-blue transition-all">
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          {newStatus === 'suspended' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              Suspending will immediately block this business from the platform.
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => onAction(business._id, newStatus, newPlan)}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SABusinesses() {
  const [businesses, setBusinesses] = useState(MOCK);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('all');
  const [loading, setLoading]       = useState(false);
  const [managing, setManaging]     = useState(null);

  function load() {
    setLoading(true);
    saClient.get('/api/superadmin/businesses')
      .then(r => setBusinesses(r.data.businesses || MOCK))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const filtered = businesses.filter(b => {
    const matchSearch = !search ||
      b.businessName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleAction(id, status, plan) {
    saClient.patch(`/api/superadmin/businesses/${id}/status`, { status })
      .catch(() => {});
    saClient.patch(`/api/superadmin/businesses/${id}/plan`, { plan })
      .catch(() => {});
    setBusinesses(bs => bs.map(b => b._id === id ? { ...b, status, plan } : b));
    setManaging(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {managing && (
        <ActionModal
          business={managing}
          onClose={() => setManaging(null)}
          onAction={handleAction}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Business Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{businesses.length} total businesses on the platform</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:shadow-sm transition-all disabled:opacity-40">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     count: businesses.length,                               color: 'bg-z-blue' },
          { label: 'Active',    count: businesses.filter(b => b.status === 'active').length,    color: 'bg-emerald-500' },
          { label: 'Trial',     count: businesses.filter(b => b.status === 'trial').length,     color: 'bg-blue-500' },
          { label: 'Suspended', count: businesses.filter(b => b.status === 'suspended').length, color: 'bg-red-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
            <p className="text-2xl font-extrabold text-slate-800">{count}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search businesses..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all" />
        </div>
        <div className="flex gap-2">
          {[['all','All'],['active','Active'],['trial','Trial'],['suspended','Suspended']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterStatus === val
                  ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Business', 'Email', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {b.businessName[0]}
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">{b.businessName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{b.email}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${PLAN_CLS[b.plan] || ''}`}>
                      {b.plan}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_CONFIG[b.status]?.cls || ''}`}>
                      {STATUS_CONFIG[b.status]?.label || b.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => setManaging(b)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-z-blue bg-z-blue/8 border border-z-blue/20 rounded-lg hover:bg-z-blue/15 transition-colors">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={32} className="opacity-30 mb-3" />
            <p className="text-sm">No businesses found</p>
          </div>
        )}
      </div>
    </div>
  );
}
