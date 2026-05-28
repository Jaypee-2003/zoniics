import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Phone, Zap, BarChart2, Bot, Globe, Menu, X,
  ArrowRight, CheckCircle, Star, ChevronDown, ChevronUp,
  Users, Play, Sparkles, Shield, Clock, TrendingUp, Activity,
  Layers, Workflow, BrainCircuit, Headphones, Mail, ExternalLink,
  Share2, Code, Target, Upload,
} from 'lucide-react';
import logo from '../assets/zoniics-logo.png';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const STATS = [
  { value: '10,000+', label: 'Businesses Powered' },
  { value: '50M+',    label: 'Messages Handled' },
  { value: '99.9%',   label: 'Uptime SLA' },
  { value: '4.9/5',   label: 'Customer Rating' },
];

const FEATURES = [
  {
    icon: Phone,
    title: 'AI Voice Calling',
    description: 'Deploy human-like AI calling agents that qualify leads, confirm appointments, and follow up — 24/7, at scale.',
    tags: ['Multi-language', 'Voice Cloning', 'Real-time Transcription'],
    color: 'blue',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Automation',
    description: 'Automate your entire WhatsApp presence — from smart auto-replies to broadcast campaigns and AI chatbot conversations.',
    tags: ['AI Chatbot', 'Broadcasts', 'Smart Replies'],
    color: 'emerald',
  },
  {
    icon: BrainCircuit,
    title: 'AI Workflow Builder',
    description: 'Build powerful automations visually. Drag-and-drop logic, AI conditions, triggers — no code needed.',
    tags: ['Drag & Drop', 'AI Logic', 'Visual Builder'],
    color: 'purple',
  },
  {
    icon: Users,
    title: 'CRM & Lead Pipeline',
    description: 'Track every lead, manage your pipeline, and let AI score and prioritize your hottest prospects automatically.',
    tags: ['Lead Scoring', 'Pipeline View', 'AI Insights'],
    color: 'orange',
  },
  {
    icon: BarChart2,
    title: 'Analytics & Insights',
    description: 'Deep performance analytics across calls, messages, and campaigns. See what\'s working in real time.',
    tags: ['Live Metrics', 'Conversion Tracking', 'Team Reports'],
    color: 'cyan',
  },
  {
    icon: Zap,
    title: 'Smart Automation',
    description: 'Priority queues, instant lead processing, and real-time AI workers ensure your best leads are always served first.',
    tags: ['Priority Queues', 'Real-time', 'Auto Follow-up'],
    color: 'pink',
  },
];

const colorMap = {
  blue:    { bg: 'bg-blue-50',    icon: 'text-z-blue',      border: 'hover:border-blue-300' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'hover:border-emerald-300' },
  purple:  { bg: 'bg-purple-50',  icon: 'text-z-purple',    border: 'hover:border-purple-300' },
  orange:  { bg: 'bg-orange-50',  icon: 'text-orange-500',  border: 'hover:border-orange-300' },
  cyan:    { bg: 'bg-cyan-50',    icon: 'text-cyan-600',    border: 'hover:border-cyan-300' },
  pink:    { bg: 'bg-pink-50',    icon: 'text-pink-500',    border: 'hover:border-pink-300' },
};

const STEPS = [
  {
    step: '01',
    title: 'Connect your channels',
    desc: 'Link WhatsApp Business, Twilio, or any voice provider in minutes. No engineering team required.',
    icon: Globe,
  },
  {
    step: '02',
    title: 'Configure your AI agent',
    desc: 'Define your AI personality, scripts, and workflows. The AI learns your business and handles conversations naturally.',
    icon: Bot,
  },
  {
    step: '03',
    title: 'Launch and scale',
    desc: 'Go live instantly. Monitor performance in real-time, iterate, and scale to thousands of conversations daily.',
    icon: TrendingUp,
  },
];

const USE_CASES = [
  { label: 'Sales Teams',      icon: Target,     desc: 'Auto-qualify leads and book demos' },
  { label: 'Customer Support', icon: Headphones, desc: 'Instant AI support, 24/7' },
  { label: 'Real Estate',      icon: Layers,     desc: 'Property inquiries & tours' },
  { label: 'Clinics & Health', icon: Activity,   desc: 'Appointment reminders & follow-ups' },
  { label: 'E-commerce',       icon: Workflow,   desc: 'Order updates & customer retention' },
  { label: 'Agencies',         icon: Sparkles,   desc: 'White-label for your clients' },
];

const TESTIMONIALS = [
  {
    name: 'Rahul Verma',
    title: 'Sales Head, PropMax Realty',
    avatar: 'RV',
    color: 'bg-z-blue',
    quote: 'Zoniics AI calls our fresh leads within 60 seconds. Our show-up rate went from 30% to 72%. This is genuinely the future.',
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    title: 'Founder, HealthFirst Clinic',
    avatar: 'PS',
    color: 'bg-emerald-500',
    quote: 'We automated all our appointment reminders. No-shows dropped by 60% in the first month. The ROI is incredible.',
    stars: 5,
  },
  {
    name: 'Omar Al-Rashid',
    title: 'CEO, GrowthAgency Dubai',
    avatar: 'OA',
    color: 'bg-z-purple',
    quote: 'We white-label Zoniics for 12 of our clients. The platform is so polished our clients think we built it ourselves.',
    stars: 5,
  },
];

const INTEGRATIONS = [
  { name: 'WhatsApp Business', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Twilio',            color: 'text-red-600 bg-red-50 border-red-200' },
  { name: 'OpenAI',            color: 'text-gray-700 bg-gray-50 border-gray-200' },
  { name: 'Stripe',            color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { name: 'Exotel',            color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { name: 'Zapier',            color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { name: 'Slack',             color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { name: 'HubSpot',           color: 'text-rose-600 bg-rose-50 border-rose-200' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    per: '/month',
    badge: null,
    highlight: false,
    desc: 'Perfect for small businesses just getting started.',
    features: [
      '50 requests / minute',
      'Inbound WhatsApp only',
      'Up to 2,000 messages / mo',
      'Single AI worker',
      'Standard queue priority',
      'Community support',
      'Basic analytics',
    ],
    missing: ['Outbound Voice Calls', 'Priority Queue', 'CRM Integration'],
  },
  {
    name: 'Pro',
    price: '$79',
    per: '/month',
    badge: 'Most Popular',
    highlight: true,
    desc: 'For growing teams that need full omnichannel power.',
    features: [
      '200 requests / minute',
      'WhatsApp + Inbound Voice',
      'Up to 20,000 messages / mo',
      'Multi-worker processing',
      'Priority queue (level 2)',
      'Email support',
      'Campaign Dashboard',
      'Full analytics & CRM',
    ],
    missing: ['Dedicated Worker', 'Outbound Cold Calling'],
  },
  {
    name: 'Enterprise',
    price: '$199',
    per: '/month',
    badge: null,
    highlight: false,
    desc: 'Full power for high-volume, mission-critical teams.',
    features: [
      '1,000+ requests / minute',
      'Omnichannel + Outbound Calls',
      'Unlimited messages',
      'Dedicated AI worker',
      'Instant priority (level 1)',
      'Priority support + SLA',
      'CSV Upload & Auto-dial',
      'Voice cloning support',
      'Custom AI persona',
    ],
    missing: [],
  },
];

const FAQS = [
  {
    q: 'Do I need technical knowledge to use Zoniics AI?',
    a: 'No. Zoniics AI is built for non-technical users. The setup wizard walks you through connecting channels, configuring your AI agent, and launching — in under 15 minutes.',
  },
  {
    q: 'Which countries and languages does the AI support?',
    a: 'The AI supports 50+ languages including English, Hindi, Arabic, Spanish, Portuguese, French, and more. Voice calling works globally via Twilio and Exotel.',
  },
  {
    q: 'How does the AI voice calling work?',
    a: 'Zoniics AI uses advanced voice models to make outbound calls that sound human-like. You define the script, the AI adapts conversationally, and all calls are transcribed and summarized automatically.',
  },
  {
    q: 'Is my data secure?',
    a: "Yes. All data is encrypted in transit and at rest. We're SOC 2 compliant and follow GDPR guidelines. Your business data is never used to train external AI models.",
  },
  {
    q: 'Can I use Zoniics for multiple businesses?',
    a: 'Yes. Our multi-tenant architecture lets agencies manage multiple client workspaces from a single account, each with isolated data and custom branding.',
  },
  {
    q: 'What happens if I exceed my plan limits?',
    a: "You'll receive a notification before hitting limits. You can upgrade instantly from your dashboard, or contact us for a custom enterprise plan.",
  },
];

function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-z-border' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Zoniics AI" className="h-8 sm:h-9 object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm font-medium text-z-muted hover:text-z-text transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-z-muted hover:text-z-text transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
              Get started free
            </Link>
          </div>
          <button onClick={() => setOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-z-muted hover:text-z-text hover:bg-z-surface transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-z-border shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-z-muted hover:text-z-text hover:bg-z-surface transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-3 space-y-2 border-t border-z-border mt-2">
              <Link to="/login" className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-z-text bg-z-surface rounded-xl">
                Sign in
              </Link>
              <Link to="/register"
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-gradient rounded-xl shadow-lg">
                Get started free <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-z-border rounded-2xl overflow-hidden bg-white">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-z-bg transition-colors">
        <span className="font-semibold text-z-text text-sm sm:text-base pr-4">{q}</span>
        {open
          ? <ChevronUp size={18} className="flex-shrink-0 text-z-blue" />
          : <ChevronDown size={18} className="flex-shrink-0 text-z-muted" />}
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-5 text-z-muted text-sm leading-relaxed border-t border-z-border bg-z-bg/50">
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar scrolled={scrolled} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-z-blue/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-z-purple/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-z-blue/8 border border-z-blue/20 rounded-full text-z-blue text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
            <Sparkles size={14} />
            AI-powered communication platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-z-text leading-tight mb-6 tracking-tight">
            Automate Conversations{' '}
            <span className="gradient-text block sm:inline">Intelligently.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-z-muted leading-relaxed mb-8 sm:mb-10">
            Zoniics AI gives your business a 24/7 communication team — AI voice calling, WhatsApp automation, CRM, and workflows — all in one beautiful platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <Link to="/register"
              className="flex items-center gap-2 px-7 py-4 text-white font-bold text-base bg-brand-gradient rounded-2xl hover:opacity-90 transition-all shadow-2xl shadow-z-blue/30 w-full sm:w-auto justify-center">
              Start free — no credit card
              <ArrowRight size={18} />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-7 py-4 text-z-text font-semibold text-base bg-white border border-z-border rounded-2xl hover:border-z-blue hover:shadow-md transition-all w-full sm:w-auto justify-center">
              <Play size={16} className="text-z-blue" />
              See how it works
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-white border border-z-border rounded-2xl p-4 shadow-sm">
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text mb-1">{value}</div>
                <div className="text-xs sm:text-sm text-z-muted font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-12 sm:mt-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-z-border rounded-2xl sm:rounded-3xl shadow-2xl shadow-z-blue/10 overflow-hidden">
            <div className="bg-z-bg border-b border-z-border px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="ml-4 flex-1 bg-white border border-z-border rounded-lg px-3 py-1 text-xs text-z-muted max-w-xs">
                app.zoniics.ai/dashboard
              </div>
            </div>
            <div className="flex h-64 sm:h-80 md:h-96 overflow-hidden">
              <div className="hidden sm:flex w-44 bg-white border-r border-z-border flex-col p-3 gap-1 flex-shrink-0">
                {['Overview', 'Voice Calls', 'WhatsApp', 'Contacts', 'Analytics', 'Automation'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    i === 0 ? 'bg-z-blue/10 text-z-blue' : 'text-z-muted'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-z-blue' : 'bg-z-border'}`} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-z-bg p-4 sm:p-5 overflow-hidden min-w-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Interactions', val: '12,847', color: 'bg-z-blue' },
                    { label: 'WhatsApp',     val: '8,291',  color: 'bg-emerald-500' },
                    { label: 'Voice Calls',  val: '4,556',  color: 'bg-z-purple' },
                    { label: 'Today',        val: '234',    color: 'bg-orange-500' },
                  ].map(c => (
                    <div key={c.label} className="bg-white border border-z-border rounded-xl p-3">
                      <div className="text-xs text-z-muted mb-1">{c.label}</div>
                      <div className="text-lg font-bold text-z-text">{c.val}</div>
                      <div className={`h-1 rounded-full mt-2 ${c.color}`} />
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-z-border rounded-xl p-4">
                  <div className="text-xs font-semibold text-z-muted mb-3">Weekly Activity</div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-gradient rounded-t opacity-80"
                        style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                      <span key={d} className="text-[10px] text-z-muted">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 border-y border-z-border bg-z-bg/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm font-semibold text-z-muted uppercase tracking-widest mb-6">
            Trusted by teams across industries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map(({ name, color }) => (
              <span key={name} className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border ${color}`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-z-purple/8 border border-z-purple/20 rounded-full text-z-purple text-xs sm:text-sm font-semibold mb-4">
              <Sparkles size={14} />
              Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-z-text mb-4 leading-tight">
              Everything you need to{' '}
              <span className="gradient-text">automate communication</span>
            </h2>
            <p className="max-w-2xl mx-auto text-z-muted text-lg leading-relaxed">
              One unified platform for every business communication channel — built for teams who want results without complexity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, description, tags, color }) => {
              const c = colorMap[color];
              return (
                <div key={title}
                  className={`group bg-white border border-z-border rounded-2xl p-6 hover:shadow-xl hover:shadow-z-blue/5 ${c.border} transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${c.bg}`}>
                    <Icon size={24} className={c.icon} />
                  </div>
                  <h3 className="text-lg font-bold text-z-text mb-3">{title}</h3>
                  <p className="text-z-muted text-sm leading-relaxed mb-5">{description}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-z-bg border border-z-border rounded-full text-xs font-medium text-z-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-z-bg/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs sm:text-sm font-semibold mb-4">
              <Zap size={14} />
              Simple by design
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-z-text mb-4 leading-tight">
              Up and running in{' '}
              <span className="gradient-text">15 minutes</span>
            </h2>
            <p className="max-w-xl mx-auto text-z-muted text-lg">
              Three steps from signup to your first AI conversation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step}
                className="bg-white border border-z-border rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:border-z-blue/30 transition-all">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-z-blue/20">
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className="text-3xl font-black text-z-border">{step}</span>
                </div>
                <h3 className="text-lg font-bold text-z-text mb-3">{title}</h3>
                <p className="text-z-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-4">
              Built for every type of team
            </h2>
            <p className="text-z-muted text-lg max-w-xl mx-auto">
              Whether you're a solo founder or an enterprise team, Zoniics AI adapts to your workflow.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {USE_CASES.map(({ label, icon: Icon, desc }) => (
              <div key={label}
                className="flex flex-col items-center text-center p-4 sm:p-5 bg-white border border-z-border rounded-2xl hover:border-z-blue/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-z-blue/8 flex items-center justify-center mb-3 group-hover:bg-z-blue/15 transition-colors">
                  <Icon size={20} className="text-z-blue" />
                </div>
                <p className="font-bold text-z-text text-sm mb-1">{label}</p>
                <p className="text-z-muted text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature spotlight: WhatsApp ──────────────────────── */}
      <section className="py-16 sm:py-24 bg-z-bg/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs sm:text-sm font-semibold mb-6">
                <MessageSquare size={14} />
                WhatsApp Automation
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-5 leading-tight">
                Turn WhatsApp into your{' '}
                <span className="gradient-text">best sales channel</span>
              </h2>
              <p className="text-z-muted text-lg leading-relaxed mb-8">
                AI that understands context, remembers conversations, and responds instantly — in your customer's language, at any hour.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'AI chatbot handles inquiries automatically',
                  'Broadcast campaigns to thousands of contacts',
                  'Smart follow-up sequences that convert',
                  'Lead qualification via conversation',
                  'Seamless handoff to human agents',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-z-muted">
                    <CheckCircle size={18} className="flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
                Set up WhatsApp Automation <ArrowRight size={16} />
              </Link>
            </div>
            {/* WhatsApp chat mockup */}
            <div className="bg-white border border-z-border rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-emerald-600 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Zoniics AI Agent</p>
                  <p className="text-emerald-200 text-xs">Online · Replying instantly</p>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-[#e5ddd5] min-h-48">
                <div className="flex justify-end">
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-gray-800">Hi, I'm interested in your property listings. Do you have 3BHK flats near the airport?</p>
                    <p className="text-[10px] text-gray-500 mt-1 text-right">9:42 AM ✓✓</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%] shadow-sm">
                    <p className="text-sm text-gray-800">Hi! 👋 Yes, we have several 3BHK options near the airport. May I know your budget range and preferred move-in date?</p>
                    <p className="text-[10px] text-gray-500 mt-1">9:42 AM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-gray-800">Budget is around 80L. Looking to move in by March.</p>
                    <p className="text-[10px] text-gray-500 mt-1 text-right">9:43 AM ✓✓</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%] shadow-sm">
                    <p className="text-sm text-gray-800">Perfect! I've found 4 properties matching your criteria. I'll share details and can schedule a site visit for you. Which day works best? 🏠</p>
                    <p className="text-[10px] text-gray-500 mt-1">9:43 AM</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-white border-t border-z-border flex items-center gap-2">
                <div className="flex-1 bg-z-bg border border-z-border rounded-full px-4 py-2 text-xs text-z-muted">
                  AI is typing…
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <ArrowRight size={14} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature spotlight: Voice ──────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-z-blue/5 to-z-purple/5 border border-z-border rounded-2xl p-6 sm:p-8">
              <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-z-text text-sm">AI Agent • Rahul Kumar</p>
                      <p className="text-xs text-emerald-600 font-medium">● Live call — 1:24</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[20, 35, 15, 30, 25].map((h, i) => (
                      <div key={i} className="w-1 rounded-full bg-brand-gradient" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-z-bg rounded-xl p-3 text-xs text-z-muted italic leading-relaxed">
                  "...yes, we do offer flexible EMI plans. Given your interest in the Whitefield location, I can arrange a priority site visit for you this Saturday. Would 10 AM work?"
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Calls Today', value: '142', color: 'text-z-blue' },
                  { label: 'Avg Duration', value: '3:42', color: 'text-z-purple' },
                  { label: 'Conversion', value: '34%', color: 'text-emerald-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white border border-z-border rounded-xl p-3 text-center">
                    <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-z-muted mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-z-blue/8 border border-z-blue/20 rounded-full text-z-blue text-xs sm:text-sm font-semibold mb-6">
                <Phone size={14} />
                AI Voice Calling
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-5 leading-tight">
                AI agents that call your leads{' '}
                <span className="gradient-text">while you sleep</span>
              </h2>
              <p className="text-z-muted text-lg leading-relaxed mb-8">
                Upload your lead list, define your script, and let the AI make hundreds of calls daily — qualifying prospects, booking appointments, and following up automatically.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Human-like conversations with natural pauses',
                  'Multi-language support — 50+ languages',
                  'Real-time transcription and call summaries',
                  'Automatic outcome categorization',
                  'CSV upload for bulk cold calling',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-z-muted">
                    <CheckCircle size={18} className="flex-shrink-0 text-z-blue" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-brand-gradient rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-z-blue/20">
                Launch AI Voice Calling <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-z-bg/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs sm:text-sm font-semibold mb-4">
              <Star size={14} className="fill-amber-500 text-amber-500" />
              Customer Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-4">Loved by teams worldwide</h2>
            <p className="text-z-muted text-lg max-w-xl mx-auto">
              See how businesses like yours are transforming customer communication.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map(({ name, title, avatar, color, quote, stars }) => (
              <div key={name}
                className="bg-white border border-z-border rounded-2xl p-6 hover:shadow-lg hover:border-z-blue/30 transition-all">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-z-text text-sm leading-relaxed mb-5 font-medium">"{quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-z-border">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-z-text text-sm">{name}</p>
                    <p className="text-xs text-z-muted">{title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-z-blue/8 border border-z-blue/20 rounded-full text-z-blue text-xs sm:text-sm font-semibold mb-4">
              <Shield size={14} />
              Simple, transparent pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-4">
              Start free, scale when you're ready
            </h2>
            <p className="text-z-muted text-lg max-w-xl mx-auto">
              No hidden fees. No long-term contracts. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto items-stretch">
            {PLANS.map(({ name, price, per, badge, highlight, desc, features, missing }) => (
              <div key={name}
                className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col transition-all ${
                  highlight
                    ? 'bg-brand-gradient border-transparent shadow-2xl shadow-z-blue/25 md:-translate-y-2'
                    : 'bg-white border-z-border hover:border-z-blue/40 hover:shadow-lg'
                }`}>
                {badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-white text-z-blue text-xs font-bold rounded-full shadow-md border border-z-border">
                      {badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${highlight ? 'text-white' : 'text-z-text'}`}>{name}</h3>
                  <p className={`text-xs mb-4 ${highlight ? 'text-white/70' : 'text-z-muted'}`}>{desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${highlight ? 'text-white' : 'gradient-text'}`}>{price}</span>
                    <span className={`text-sm font-medium ${highlight ? 'text-white/70' : 'text-z-muted'}`}>{per}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${highlight ? 'text-white/90' : 'text-z-muted'}`}>
                      <CheckCircle size={16} className={`flex-shrink-0 mt-0.5 ${highlight ? 'text-white' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                  {missing.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm opacity-35 line-through ${highlight ? 'text-white' : 'text-z-muted'}`}>
                      <X size={16} className="flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                    highlight
                      ? 'bg-white text-z-blue hover:bg-z-bg shadow-lg'
                      : 'bg-brand-gradient text-white hover:opacity-90 shadow-lg shadow-z-blue/20'
                  }`}>
                  Get started <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-z-muted mt-8">
            Need a custom plan?{' '}
            <a href="mailto:sales@zoniics.ai" className="text-z-blue hover:underline font-medium">Talk to sales →</a>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 bg-z-bg/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-z-text mb-4">Frequently asked questions</h2>
            <p className="text-z-muted text-lg">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-brand-gradient rounded-3xl p-8 sm:p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full text-white text-xs sm:text-sm font-semibold mb-6">
                <Sparkles size={14} />
                Start for free today
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
                Ready to transform your business communication?
              </h2>
              <p className="text-white/75 text-lg mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
                Join 10,000+ businesses already using Zoniics AI to automate communication, convert more leads, and scale effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register"
                  className="flex items-center gap-2 px-8 py-4 bg-white text-z-blue font-bold text-base rounded-2xl hover:bg-z-bg transition-colors shadow-xl w-full sm:w-auto justify-center">
                  Get started — it's free
                  <ArrowRight size={18} />
                </Link>
                <a href="mailto:sales@zoniics.ai"
                  className="flex items-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-semibold text-base rounded-2xl hover:bg-white/20 transition-colors w-full sm:w-auto justify-center">
                  <Mail size={16} />
                  Talk to sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-z-text py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <img src={logo} alt="Zoniics AI" className="h-9 object-contain mb-4 brightness-200 opacity-90" />
              <p className="text-gray-400 text-sm leading-relaxed">
                The AI communication platform for modern businesses.
              </p>
              <div className="flex gap-3 mt-5">
                {[ExternalLink, Share2, Code].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: 'Product',  links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'] },
              { title: 'Company',  links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
              { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2025 Zoniics AI. All rights reserved.</p>
            <p className="text-gray-500 text-sm">Built for the future of business communication</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
