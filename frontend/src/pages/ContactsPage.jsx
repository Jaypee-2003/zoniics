import { useState, useEffect } from 'react';
import {
  Search, Plus, Phone, MessageSquare,
  Users, TrendingUp, Flame, Clock, CheckCircle, Loader,
  X, Filter,
} from 'lucide-react';
import client from '../api/client';

const STATUS_CONFIG = {
  hot:    { label: 'Hot Lead',    bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    icon: Flame },
  warm:   { label: 'Warm Lead',   bg: 'bg-amber-50',   text: 'text-amber-600',  border: 'border-amber-200',  icon: TrendingUp },
  cold:   { label: 'Cold Lead',   bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200',   icon: Clock },
  closed: { label: 'Closed',      bg: 'bg-emerald-50', text: 'text-emerald-600',border: 'border-emerald-200',icon: CheckCircle },
};

const SOURCE_CLS = {
  WhatsApp: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Voice:    'bg-z-blue/8 text-z-blue border-z-blue/20',
  CSV:      'bg-slate-100 text-slate-600 border-slate-200',
  Manual:   'bg-purple-50 text-purple-700 border-purple-200',
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.cold;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

function AddContactModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'cold', source: 'Manual' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-z-blue transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Add Contact</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Full Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="Jane Smith" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Phone *</label>
            <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Source</label>
              <select value={form.source} onChange={set('source')} className={inputCls}>
                {Object.keys(SOURCE_CLS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => { onAdded(form); onClose(); }}
            disabled={!form.name || !form.phone}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50">
            Add Contact
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => {
    setLoading(true);
    client.get('/api/interactions?limit=50')
      .then(r => {
        const interactions = r.data.interactions || [];
        const seen = new Set();
        const derived = interactions
          .filter(i => i.from && !seen.has(i.from) && seen.add(i.from))
          .map(i => ({
            id: i._id,
            name: i.contactName || i.from || 'Unknown',
            phone: i.from || '',
            email: '',
            status: i.outcome === 'interested' ? 'hot' : i.outcome === 'callback' ? 'warm' : 'cold',
            source: i.channel === 'whatsapp' ? 'WhatsApp' : i.channel === 'voice' ? 'Voice' : 'Manual',
            lastContact: new Date(i.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short' }),
          }));
        setContacts(derived);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(form) {
    setContacts(cs => [{
      id: Date.now(),
      name: form.name, phone: form.phone, email: form.email,
      status: form.status, source: form.source, lastContact: 'Just now',
    }, ...cs]);
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onAdded={handleAdd} />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Contacts</h1>
          <p className="text-z-muted text-sm mt-0.5">
            {contacts.length > 0
              ? `${contacts.length} contacts from your calls and WhatsApp`
              : 'All leads captured from your AI calls and WhatsApp'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 shadow-md shadow-z-blue/20">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-z-muted" />
          <input type="text" placeholder="Search by name or phone…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-z-border rounded-xl focus:outline-none focus:border-z-blue focus:ring-2 focus:ring-z-blue/10 transition-all" />
        </div>
        <div className="flex gap-2">
          {[['all','All'], ['hot','Hot'], ['warm','Warm'], ['cold','Cold'], ['closed','Closed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filterStatus === val
                  ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                  : 'bg-white text-z-muted border-z-border hover:text-z-text'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-z-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-z-muted text-sm gap-2">
            <Loader size={16} className="animate-spin text-z-blue" /> Loading contacts…
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-z-muted gap-3">
            <div className="w-16 h-16 rounded-2xl bg-z-surface border border-z-border flex items-center justify-center">
              <Users size={28} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="text-xs text-center max-w-64 leading-relaxed">
              Contacts are captured automatically from your AI voice calls and WhatsApp conversations.
            </p>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-gradient rounded-xl hover:opacity-90">
              <Plus size={14} /> Add manually
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-z-border bg-z-surface/50">
                  {['Contact', 'Phone', 'Status', 'Source', 'Last Contact', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-z-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-z-border last:border-0 hover:bg-z-surface/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-z-text text-sm">{c.name}</p>
                          {c.email && <p className="text-xs text-z-muted">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-z-muted font-mono">{c.phone}</td>
                    <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${SOURCE_CLS[c.source] || ''}`}>
                        {c.source}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-z-muted whitespace-nowrap">{c.lastContact}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-z-muted hover:text-z-blue hover:bg-z-blue/8 rounded-lg transition-colors">
                          <Phone size={13} />
                        </button>
                        <button className="p-1.5 text-z-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && contacts.length > 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-z-muted">
                <p className="text-sm">No contacts match your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
