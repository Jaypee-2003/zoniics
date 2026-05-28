import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Settings, Shield,
  LogOut, Menu, X, ChevronRight, Bell, BarChart2,
  BrainCircuit, AlertTriangle, Zap,
} from 'lucide-react';
import logo from '../assets/zoniics-logo.png';

const NAV_GROUPS = [
  {
    label: 'Platform',
    items: [
      { to: '/superadmin',           label: 'Overview',      icon: LayoutDashboard, end: true },
      { to: '/superadmin/analytics', label: 'Analytics',     icon: BarChart2 },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/superadmin/businesses', label: 'Businesses',   icon: Users },
      { to: '/superadmin/plans',      label: 'Plans',        icon: CreditCard },
    ],
  },
  {
    label: 'AI & System',
    items: [
      { to: '/superadmin/ai',         label: 'AI Management', icon: BrainCircuit },
      { to: '/superadmin/settings',   label: 'Platform Settings', icon: Settings },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/superadmin/security',   label: 'Security & Audit', icon: Shield },
    ],
  },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-white/15 text-white border border-white/20'
      : 'text-slate-300 hover:text-white hover:bg-white/10'
  }`;

function SidebarNav({ onLinkClick, onLogout }) {
  return (
    <>
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
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

      {/* Warning badge */}
      <div className="mx-3 mb-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={13} className="text-amber-400" />
          <span className="text-xs font-bold text-amber-300">Super Admin Mode</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">All actions are logged and audited.</p>
      </div>

      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('zoniics_sa_token');
    navigate('/superadmin/login');
  }

  const currentLabel = NAV_GROUPS.flatMap(g => g.items)
    .find(item => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label
    || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-shrink-0 flex-col"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="h-14 flex items-center gap-3 px-5 border-b border-white/10 flex-shrink-0">
          <img src={logo} alt="Zoniics AI" className="h-7 object-contain brightness-200 opacity-90" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border border-slate-600 rounded px-1.5 py-0.5">
            Admin
          </span>
        </div>
        <SidebarNav onLinkClick={() => {}} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="h-14 flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Zoniics AI" className="h-7 object-contain brightness-200 opacity-90" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border border-slate-600 rounded px-1.5 py-0.5">Admin</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onLinkClick={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Page wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="font-semibold text-slate-700">Zoniics Platform</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-z-blue">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Zap size={13} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700">Super Admin</span>
            </div>
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
              SA
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
