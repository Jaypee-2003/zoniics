import { useState } from 'react';
import {
  Workflow, Plus, Play, Pause, Zap,
  MessageSquare, Phone, Clock, CheckCircle, Users,
  ArrowRight, ArrowDown, Bot,
} from 'lucide-react';

const WORKFLOW_TEMPLATES = [
  {
    id: 'lead-nurture',
    name: 'Lead Nurturing Sequence',
    desc: 'Automatically reach new leads with a WhatsApp intro, then follow up with an AI call if they don\'t reply.',
    category: 'Sales',
    active: false,
    steps: [
      { type: 'trigger',   label: 'New Lead Added',       icon: Users,         color: 'text-z-blue bg-z-blue/10' },
      { type: 'action',    label: 'Send WhatsApp intro',  icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
      { type: 'wait',      label: 'Wait 24 hours',         icon: Clock,         color: 'text-amber-600 bg-amber-50' },
      { type: 'condition', label: 'Replied to message?',   icon: CheckCircle,   color: 'text-purple-600 bg-purple-50' },
      { type: 'action',    label: 'Place AI Call',         icon: Phone,         color: 'text-z-blue bg-z-blue/10' },
    ],
  },
  {
    id: 'appointment',
    name: 'Appointment Booking Flow',
    desc: 'Book and confirm appointments via WhatsApp with AI, and send automatic reminders before the meeting.',
    category: 'Operations',
    active: false,
    steps: [
      { type: 'trigger',  label: 'Customer requests booking', icon: MessageSquare, color: 'text-z-purple bg-purple-50' },
      { type: 'action',   label: 'AI shows available slots',  icon: Clock,         color: 'text-amber-600 bg-amber-50' },
      { type: 'action',   label: 'Confirm booking via chat',  icon: CheckCircle,   color: 'text-emerald-600 bg-emerald-50' },
      { type: 'action',   label: 'Send reminder 1h before',   icon: Zap,           color: 'text-z-blue bg-z-blue/10' },
    ],
  },
  {
    id: 'cold-calling',
    name: 'Cold Call Campaign',
    desc: 'Upload a CSV of leads and your AI dials each one automatically. Hot leads get a WhatsApp follow-up.',
    category: 'Sales',
    active: false,
    steps: [
      { type: 'trigger',   label: 'CSV Uploaded',            icon: Users,         color: 'text-orange-600 bg-orange-50' },
      { type: 'action',    label: 'AI Dials Lead',            icon: Phone,         color: 'text-z-blue bg-z-blue/10' },
      { type: 'condition', label: 'Lead Interested?',         icon: CheckCircle,   color: 'text-emerald-600 bg-emerald-50' },
      { type: 'action',    label: 'Send WhatsApp follow-up',  icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
    ],
  },
  {
    id: 'reengagement',
    name: 'Re-engagement Campaign',
    desc: 'Win back customers who haven\'t interacted in 30+ days with a personalized WhatsApp message.',
    category: 'Retention',
    active: false,
    steps: [
      { type: 'trigger',  label: 'No activity for 30 days',  icon: Clock,         color: 'text-red-600 bg-red-50' },
      { type: 'action',   label: 'Send re-engagement message',icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
      { type: 'wait',     label: 'Wait 48 hours',             icon: Clock,         color: 'text-amber-600 bg-amber-50' },
      { type: 'condition',label: 'Still no reply?',           icon: CheckCircle,   color: 'text-purple-600 bg-purple-50' },
      { type: 'action',   label: 'Place follow-up AI call',   icon: Phone,         color: 'text-z-blue bg-z-blue/10' },
    ],
  },
];

const STEP_TYPE_LABELS = {
  trigger:   'Trigger',
  action:    'Action',
  wait:      'Wait',
  condition: 'Condition',
};

const CATEGORY_COLORS = {
  Sales:      'bg-blue-50 text-blue-700 border-blue-200',
  Operations: 'bg-purple-50 text-purple-700 border-purple-200',
  Retention:  'bg-amber-50 text-amber-700 border-amber-200',
};

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState(WORKFLOW_TEMPLATES);
  const [expanded, setExpanded]   = useState(null);
  const [filter, setFilter]       = useState('all');

  const toggle = id => setWorkflows(ws => ws.map(w => w.id === id ? { ...w, active: !w.active } : w));

  const categories = ['all', ...new Set(WORKFLOW_TEMPLATES.map(w => w.category))];
  const filtered = filter === 'all' ? workflows : workflows.filter(w => w.category === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Automation</h1>
          <p className="text-z-muted text-sm mt-0.5">Pre-built workflows that combine AI calls and WhatsApp</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 shadow-md shadow-z-blue/20">
          <Plus size={16} /> Custom Workflow
        </button>
      </div>

      {/* Active count banner */}
      {workflows.some(w => w.active) && (
        <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm text-emerald-700 font-medium">
            {workflows.filter(w => w.active).length} workflow{workflows.filter(w => w.active).length > 1 ? 's are' : ' is'} active and running
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
              filter === c
                ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                : 'bg-white text-z-muted border-z-border hover:text-z-text'
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(wf => (
          <div key={wf.id}
            className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${wf.active ? 'border-emerald-200' : 'border-z-border'}`}>
            <div className="flex items-start gap-4 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${wf.active ? 'bg-emerald-100' : 'bg-z-surface'}`}>
                <Workflow size={18} className={wf.active ? 'text-emerald-600' : 'text-z-muted'} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-z-text text-sm">{wf.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${CATEGORY_COLORS[wf.category] || ''}`}>
                    {wf.category}
                  </span>
                  {wf.active && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-z-muted leading-relaxed">{wf.desc}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-z-muted bg-z-surface border border-z-border rounded-lg hover:text-z-text hover:border-z-blue transition-all">
                  {expanded === wf.id ? 'Hide' : 'View'} Flow
                </button>
                <button onClick={() => toggle(wf.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    wf.active
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}>
                  {wf.active ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
                </button>
              </div>
            </div>

            {expanded === wf.id && (
              <div className="px-5 pb-5 border-t border-z-border pt-4">
                <p className="text-xs font-semibold text-z-muted uppercase tracking-widest mb-4">Workflow Steps</p>
                <div className="flex flex-col gap-0">
                  {wf.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex flex-col items-center gap-0 sm:flex-row sm:items-center sm:gap-3">
                        <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${step.color} border-current/20 w-full sm:w-auto`}>
                          <Icon size={13} />
                          <div>
                            <span className="opacity-60 text-[10px] uppercase font-bold block">{STEP_TYPE_LABELS[step.type]}</span>
                            {step.label}
                          </div>
                        </div>
                        {i < wf.steps.length - 1 && (
                          <ArrowDown size={14} className="text-z-muted flex-shrink-0 my-1 sm:hidden" />
                        )}
                        {i < wf.steps.length - 1 && (
                          <ArrowRight size={14} className="text-z-muted flex-shrink-0 hidden sm:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-5 bg-gradient-to-br from-z-blue/5 to-z-purple/5 border border-z-blue/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <Bot size={18} className="text-z-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-z-text text-sm mb-1">Need a custom workflow?</p>
            <p className="text-xs text-z-muted leading-relaxed mb-3">
              Build multi-step workflows combining AI calls and WhatsApp messages with your own triggers and conditions.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 shadow-sm">
              <Plus size={14} /> Build Custom Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
