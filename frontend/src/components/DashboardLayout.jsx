import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, MessageSquare, LogOut, Radio,
  Menu, X, Phone, Users, BarChart2, Workflow, Bell, Search,
  ChevronRight, Sparkles, CreditCard, UserCheck,
} from 'lucide-react';
import logo from '../assets/zoniics-logo.png';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',            label: 'Overview',        icon: LayoutDashboard, end: true },
      { to: '/dashboard/analytics',  label: 'Analytics',       icon: BarChart2 },
    ],
  },
  {
    label: 'AI Channels',
    items: [
      { to: '/dashboard/voice',      label: 'Voice Calls',     icon: Phone },
      { to: '/dashboard/whatsapp',   label: 'WhatsApp',        icon: MessageSquare },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { to: '/dashboard/campaigns',  label: 'Campaigns',       icon: Radio },
      { to: '/dashboard/automation', label: 'Automation',      icon: Workflow },
      { to: '/dashboard/contacts',   label: 'Contacts',        icon: Users },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/config',     label: 'My AI Agent',     icon: Settings },
      { to: '/dashboard/logs',       label: 'Chat Logs',       icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/team',       label: 'Team',            icon: UserCheck },
      { to: '/dashboard/billing',    label: 'Billing',         icon: CreditCard },
    ],
  },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-gradient-to-r from-z-blue/10 to-z-purple/10 text-z-blue border border-z-blue/20 shadow-sm'
      : 'text-z-muted hover:text-z-text hover:bg-z-surface'
  }`;

function SidebarNav({ onLinkClick, onLogout }) {
  return (
    <>
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 text-[10px] font-bold text-z-muted uppercase tracking-widest mb-1.5">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ to, label: lbl, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={onLinkClick} className={navLinkClass}>
                  <Icon size={17} />
                  {lbl}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade prompt */}
      <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-z-blue/8 to-z-purple/8 border border-z-blue/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-z-blue" />
          <span className="text-xs font-bold text-z-text">Upgrade to Pro</span>
        </div>
        <p className="text-xs text-z-muted leading-relaxed mb-2.5">Unlock outbound voice calls and priority AI workers.</p>
        <button className="w-full py-2 text-xs font-bold text-white bg-brand-gradient rounded-lg hover:opacity-90 transition-opacity shadow-sm">
          View Plans
        </button>
      </div>

      <div className="p-3 border-t border-z-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-z-muted hover:text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('zoniics_token');
    localStorage.removeItem('zoniics_tenant_id');
    navigate('/login');
  }

  const currentLabel = NAV_GROUPS.flatMap(g => g.items)
    .find(item => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-z-bg overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-shrink-0 flex-col bg-white border-r border-z-border shadow-sm">
        <div className="h-14 flex items-center px-5 border-b border-z-border flex-shrink-0">
          <img src={logo} alt="Zoniics AI" className="h-8 object-contain" />
        </div>
        <SidebarNav onLinkClick={() => {}} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-2xl">
            <div className="h-14 flex items-center justify-between px-5 border-b border-z-border flex-shrink-0">
              <img src={logo} alt="Zoniics AI" className="h-8 object-contain" />
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onLinkClick={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ── Page wrapper ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar (desktop + mobile) */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-z-border shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface transition-colors">
              <Menu size={20} />
            </button>
            {/* Mobile logo */}
            <div className="md:hidden">
              <img src={logo} alt="Zoniics AI" className="h-7 object-contain" />
            </div>
            {/* Desktop breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-z-muted">
              <span>Dashboard</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-z-text">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-z-bg border border-z-border rounded-xl text-xs text-z-muted hover:text-z-text hover:border-z-blue transition-all">
              <Search size={14} />
              <span>Quick search…</span>
              <span className="hidden lg:inline px-1.5 py-0.5 bg-z-border rounded text-[10px] font-mono">⌘K</span>
            </button>
            <button className="relative p-2 rounded-xl text-z-muted hover:text-z-text hover:bg-z-surface transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
              Z
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
