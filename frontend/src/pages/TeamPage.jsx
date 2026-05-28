import { useState } from 'react';
import {
  Users, Plus, Mail, MoreHorizontal, Shield, CheckCircle, X,
  Trash2, Edit3, Crown, UserCheck, AlertTriangle,
} from 'lucide-react';

const PERMISSION_LABELS = {
  canManageCalls:      'Voice Calls',
  canManageWhatsApp:   'WhatsApp',
  canManageCRM:        'CRM / Contacts',
  canManageCampaigns:  'Campaigns',
  canViewAnalytics:    'Analytics (View)',
  canManageTeam:       'Team Management',
  canManageBilling:    'Billing',
  canManageAutomation: 'Automation',
};

const MOCK_MEMBERS = [
  {
    _id: '1', name: 'Rahul Mehta', email: 'rahul@propmax.in',
    role: 'tenant_admin', joinedAt: '2025-04-15', isActive: true,
    staffPermissions: Object.fromEntries(Object.keys(PERMISSION_LABELS).map(k => [k, true])),
  },
  {
    _id: '2', name: 'Priya Shah', email: 'priya@propmax.in',
    role: 'staff', joinedAt: '2025-05-01', isActive: true,
    staffPermissions: {
      canManageCalls: true, canManageWhatsApp: true, canManageCRM: true,
      canManageCampaigns: false, canViewAnalytics: true, canManageTeam: false,
      canManageBilling: false, canManageAutomation: false,
    },
  },
  {
    _id: '3', name: 'Anil Kumar', email: 'anil@propmax.in',
    role: 'staff', joinedAt: '2025-05-18', isActive: true,
    staffPermissions: {
      canManageCalls: true, canManageWhatsApp: false, canManageCRM: true,
      canManageCampaigns: true, canViewAnalytics: true, canManageTeam: false,
      canManageBilling: false, canManageAutomation: false,
    },
  },
];

function PermissionBadge({ granted }) {
  return granted
    ? <CheckCircle size={12} className="text-emerald-500" />
    : <X size={12} className="text-slate-300" />;
}

function InviteModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', permissions: Object.fromEntries(Object.keys(PERMISSION_LABELS).map(k => [k, false])) });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const togglePerm = k => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: !f.permissions[k] } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Invite Team Member</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith"
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-z-blue transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-z-blue transition-all" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs ${
                  form.permissions[key]
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <input type="checkbox" checked={form.permissions[key]} onChange={() => togglePerm(key)} className="sr-only" />
                  <PermissionBadge granted={form.permissions[key]} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg">
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPermissionsModal({ member, onClose, onSave }) {
  const [perms, setPerms] = useState({ ...member.staffPermissions });
  const toggle = k => setPerms(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Edit Permissions</h3>
            <p className="text-xs text-slate-400 mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
            <label key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
              perms[key]
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <input type="checkbox" checked={perms[key]} onChange={() => toggle(key)} className="sr-only" />
              <PermissionBadge granted={perms[key]} />
              {label}
            </label>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => { onSave(member._id, perms); onClose(); }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  function handleSavePerms(id, permissions) {
    setMembers(ms => ms.map(m => m._id === id ? { ...m, staffPermissions: permissions } : m));
  }

  const staff = members.filter(m => m.role === 'staff');
  const admins = members.filter(m => m.role === 'tenant_admin');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editingMember && (
        <EditPermissionsModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSavePerms}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{members.length} members · {staff.length} staff accounts</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Members', count: members.length,  color: 'text-z-blue' },
          { label: 'Admins',        count: admins.length,   color: 'text-z-purple' },
          { label: 'Staff',         count: staff.length,    color: 'text-emerald-600' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Members table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">All Members</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {members.map(member => (
            <div key={member._id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-700 text-sm">{member.name}</p>
                    {member.role === 'tenant_admin'
                      ? <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200"><Crown size={10} /> Admin</span>
                      : <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200"><UserCheck size={10} /> Staff</span>
                    }
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>

                  {/* Permission chips */}
                  {member.role === 'staff' && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                        member.staffPermissions[key] ? (
                          <span key={key} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                            {label}
                          </span>
                        ) : null
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {member.role === 'staff' && (
                    <button onClick={() => setEditingMember(member)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                  {member.role !== 'tenant_admin' && (
                    <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions reference */}
      <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Permission Model</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              Staff accounts can only access features their permissions allow. Admins retain full access to all platform features including billing and team management. Staff cannot see other tenants' data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
