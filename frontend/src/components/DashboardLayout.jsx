import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, MessageSquare, LogOut, Radio, Menu, X } from 'lucide-react';
import logo from '../assets/zoniics-logo.png';

const NAV = [
  { to: '/dashboard',           label: 'Overview',         icon: LayoutDashboard },
  { to: '/dashboard/config',    label: 'AI Configuration', icon: Settings },
  { to: '/dashboard/logs',      label: 'Chat Logs',        icon: MessageSquare },
  { to: '/dashboard/campaigns', label: 'Campaigns',        icon: Radio },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-r from-z-blue/10 to-z-purple/10 text-z-blue border border-z-blue/20 shadow-sm'
      : 'text-z-muted hover:text-z-text hover:bg-z-surface'
  }`;

function SidebarNav({ onLinkClick, onLogout }) {
  return (
    <>
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'} onClick={onLinkClick} className={navLinkClass}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-z-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-z-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('zoniics_token');
    localStorage.removeItem('zoniics_tenant_id');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-z-bg overflow-hidden">

      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white border-r border-z-border shadow-sm">
        <div className="h-16 flex items-center px-5 border-b border-z-border">
          <img src={logo} alt="Zoniics AI" className="h-9 object-contain" />
        </div>
        <SidebarNav onLinkClick={() => {}} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-z-border">
              <div className="flex items-center">
                <img src={logo} alt="Zoniics AI" className="h-8 object-contain" />
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onLinkClick={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ── Page wrapper ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-z-border shadow-sm flex-shrink-0">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center">
            <img src={logo} alt="Zoniics AI" className="h-7 object-contain" />
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
