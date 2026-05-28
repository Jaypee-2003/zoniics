import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, MessageSquare, Phone, Users,
  Workflow, ArrowRight, Sparkles, QrCode, Upload, Play,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Connect WhatsApp',   icon: MessageSquare, desc: 'Link your WhatsApp Business number' },
  { id: 2, label: 'Configure AI',        icon: Sparkles,      desc: 'Set your AI agent personality' },
  { id: 3, label: 'Import Leads',        icon: Upload,        desc: 'Upload your existing contacts' },
  { id: 4, label: 'Activate Workflows',  icon: Workflow,      desc: 'Enable your first automation' },
];

function StepWhatsApp({ onNext }) {
  const [connected, setConnected] = useState(false);
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-slate-600 text-sm leading-relaxed">
          Scan the QR code below with your WhatsApp Business app to link your number to Zoniics.
        </p>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center">
          <div className="w-52 h-52 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <div className="text-center text-slate-300">
              <QrCode size={80} />
              <p className="text-xs mt-2">QR Code appears here</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">
            Open WhatsApp → Linked Devices → Link a Device → Scan
          </p>
          <button onClick={() => setConnected(true)}
            className="px-5 py-2 text-sm font-semibold text-z-blue bg-z-blue/10 border border-z-blue/20 rounded-xl hover:bg-z-blue/15 transition-colors">
            Simulate Connection
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <p className="font-bold text-emerald-700">WhatsApp Connected!</p>
          <p className="text-xs text-slate-400">+91 98765 43210 is now linked</p>
        </div>
      )}

      <button onClick={onNext} disabled={!connected}
        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepAI({ onNext }) {
  const [form, setForm] = useState({ name: 'Aria', personality: 'professional', language: 'English' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">AI Agent Name</label>
          <input type="text" value={form.name} onChange={set('name')}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue transition-all" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Personality</label>
          <div className="grid grid-cols-3 gap-2">
            {['professional', 'friendly', 'assertive'].map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, personality: p }))}
                className={`py-2.5 text-sm font-semibold rounded-xl border capitalize transition-all ${
                  form.personality === p
                    ? 'bg-z-blue/10 text-z-blue border-z-blue/30'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Primary Language</label>
          <select value={form.language} onChange={set('language')}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-z-blue transition-all">
            {['English', 'Hindi', 'Arabic', 'Spanish', 'Portuguese'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs text-slate-500 mb-1 font-semibold">Preview Message</p>
        <p className="text-sm text-slate-700 italic">
          "Hi! I'm {form.name}, your {form.personality} AI assistant. How can I help you today?"
        </p>
      </div>

      <button onClick={onNext}
        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20 flex items-center justify-center gap-2">
        Save & Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepImport({ onNext }) {
  const [uploaded, setUploaded] = useState(false);
  const [skip, setSkip] = useState(false);

  return (
    <div className="space-y-5">
      {!uploaded ? (
        <>
          <div
            onClick={() => setUploaded(true)}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-z-blue hover:bg-z-blue/5 transition-all">
            <Upload size={32} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Drop your CSV here or click to browse</p>
            <p className="text-xs text-slate-400">Supports CSV with name, phone, email columns</p>
          </div>
          <button onClick={() => { setSkip(true); onNext(); }}
            className="w-full py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Skip for now
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <p className="font-bold text-emerald-700">382 contacts imported!</p>
          <p className="text-xs text-slate-400">They're ready in your CRM</p>
          <button onClick={onNext}
            className="mt-3 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20 flex items-center justify-center gap-2">
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function StepActivate({ onFinish }) {
  const [active, setActive] = useState({ welcome: false, followup: false });

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">Enable your first automation to start engaging leads instantly.</p>

      {[
        { key: 'welcome',  label: 'Welcome Message', desc: 'Send an instant WhatsApp message to new leads' },
        { key: 'followup', label: 'Follow-up Sequence', desc: 'Automatically follow up after 24h of silence' },
      ].map(({ key, label, desc }) => (
        <div key={key}
          className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
            active[key] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
          <div>
            <p className="font-semibold text-slate-700 text-sm">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </div>
          <button onClick={() => setActive(a => ({ ...a, [key]: !a[key] }))}
            className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors mt-0.5 ${active[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active[key] ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      ))}

      <button onClick={onFinish}
        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-z-blue to-z-purple rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20 flex items-center justify-center gap-2">
        <Play size={15} /> Launch My Platform
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length));
  const finish = () => navigate('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-z-blue/10 text-z-blue text-xs font-bold rounded-full mb-4">
            <Sparkles size={12} /> Getting Started
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Set up your workspace</h1>
          <p className="text-slate-500 text-sm mt-1.5">Takes about 5 minutes — your AI is ready to work after this.</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step > s.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : step === s.id ? 'bg-gradient-to-br from-z-blue to-z-purple text-white shadow-lg shadow-z-blue/20'
                  : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle size={16} /> : s.id}
                </div>
                <p className={`text-[10px] font-semibold mt-1.5 text-center w-16 ${step === s.id ? 'text-z-blue' : 'text-slate-400'}`}>
                  {s.label}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            {(() => {
              const s = STEPS[step - 1];
              const Icon = s.icon;
              return (
                <>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-z-blue to-z-purple flex items-center justify-center">
                    <Icon size={17} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{s.label}</h2>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 font-medium">Step {step}/{STEPS.length}</span>
                </>
              );
            })()}
          </div>

          <div className="p-6">
            {step === 1 && <StepWhatsApp onNext={next} />}
            {step === 2 && <StepAI onNext={next} />}
            {step === 3 && <StepImport onNext={next} />}
            {step === 4 && <StepActivate onFinish={finish} />}
          </div>
        </div>

        <button onClick={finish} className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Skip setup and go to dashboard →
        </button>
      </div>
    </div>
  );
}
